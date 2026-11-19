import { ApiError } from '@/lib/apiError';
import { fotoADataUrl, sha256DeArchivo } from '@/lib/imagenes';
import { ATAJADEROS_SIMULADOS, historialSimulado } from '@/lib/mockAtajaderos';
import {
  dentroDeFormosa,
  MENSAJE_FUERA_DE_FORMOSA,
  MIN_CARACTERES_OBSERVACIONES,
  validarAtajadero,
  validarAviso,
  validarInspeccion,
} from '@/lib/validaciones';
import {
  AsistenteRequest,
  AsistenteResponse,
  AtajaderoCreate,
  AtajaderoDetail,
  AtajaderoListResponse,
  AtajaderoSummary,
  AvisoCreado,
  AvisoPayload,
  EstadoAtajadero,
  FiltrosAtajaderos,
  IndicadorVisual,
  InspeccionCreate,
  InspeccionResponse,
  InterrupcionEscurrimiento,
  KoboImportItem,
  KoboImportResult,
} from '@/types';

// "Servidor falso" SIMULADO: imita el contrato REST de 00_CORE_CONTRACTS.md
// (códigos 404/409/422, historial append-only, asistente de solo lectura)
// mientras el backend real no expone los endpoints. Se borra entero al
// apagar USAR_DATOS_SIMULADOS en api.ts.

const CLAVE = 'atajaderos_mock_db_v1';

interface Almacen {
  atajaderos: AtajaderoSummary[];
  inspecciones: InspeccionResponse[];
}

function inicial(): Almacen {
  return {
    atajaderos: structuredClone(ATAJADEROS_SIMULADOS),
    inspecciones: historialSimulado(),
  };
}

// Persistido en localStorage para que un aviso de /reportar aparezca en el
// tablero y la demo no se pierda al recargar.
function leer(): Almacen {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) return JSON.parse(crudo) as Almacen;
  } catch {
    // datos corruptos o storage bloqueado: se arranca de cero
  }
  return inicial();
}

function guardar(db: Almacen) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(db));
  } catch {
    // sin espacio: los cambios viven solo en esta pestaña
  }
}

// Para volver al dataset original antes de la demo (desde la consola).
export function reiniciarDatosSimulados() {
  localStorage.removeItem(CLAVE);
}

const demora = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// Fecha y hora LOCAL en ISO sin zona ("2026-11-19T16:30:00"), igual que el
// seed. toISOString() daría UTC y, leído como local, correría 3 horas la hora.
function ahoraLocalIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
}

function siguienteCodigo(db: Almacen): string {
  const max = db.atajaderos.reduce(
    (m, a) => Math.max(m, Number(a.codigo_unico.slice(-4)) || 0),
    0,
  );
  return `ATJ-FSA-${String(max + 1).padStart(4, '0')}`;
}

function errorValidacion(errores: Record<string, string>): never {
  throw new ApiError(Object.values(errores).join(' · '), 422);
}

// --- Inventario ---

export async function listar(filtros: FiltrosAtajaderos): Promise<AtajaderoListResponse> {
  await demora();
  const texto = filtros.q?.trim().toLowerCase();
  const items = leer().atajaderos.filter(
    (a) =>
      (!filtros.estado || a.estado === filtros.estado) &&
      (!filtros.interrumpe_escurrimiento ||
        a.interrumpe_escurrimiento === filtros.interrumpe_escurrimiento) &&
      (!filtros.tipo_emplazamiento || a.tipo_emplazamiento === filtros.tipo_emplazamiento) &&
      (!filtros.departamento || a.departamento === filtros.departamento) &&
      (!filtros.cuenca_riacho || a.cuenca_riacho === filtros.cuenca_riacho) &&
      (!texto ||
        `${a.codigo_unico} ${a.nombre_referencia} ${a.cuenca_riacho}`
          .toLowerCase()
          .includes(texto)),
  );
  return { total: items.length, items };
}

export async function detalle(codigo: string): Promise<AtajaderoDetail> {
  await demora(200);
  const db = leer();
  const a = db.atajaderos.find((x) => x.codigo_unico === codigo);
  if (!a) throw new ApiError(`No existe el atajadero ${codigo}.`, 404);
  const inspecciones = db.inspecciones
    .filter((i) => i.atajadero_codigo === codigo)
    .sort((x, y) => y.fecha_inspeccion.localeCompare(x.fecha_inspeccion));
  return { ...a, inspecciones };
}

function nuevoSinValidar(
  db: Almacen,
  datos: Pick<AtajaderoSummary, 'nombre_referencia' | 'latitud' | 'longitud' | 'departamento' | 'cuenca_riacho'> &
    Partial<AtajaderoSummary>,
): AtajaderoSummary {
  return {
    codigo_unico: siguienteCodigo(db),
    tipo_emplazamiento: 'a_determinar',
    categoria_dato: 'SIMULADO',
    criterio_validado_por: null,
    ...datos,
    // Máquina de estados: toda alta entra sin validar (§3).
    estado: 'sin_validar',
    interrumpe_escurrimiento: 'a_verificar',
    fecha_ultima_inspeccion: null,
    total_inspecciones: 0,
  };
}

export async function crearAtajadero(p: AtajaderoCreate): Promise<AtajaderoDetail> {
  await demora();
  const errores = validarAtajadero(p);
  if (Object.keys(errores).length) errorValidacion(errores);
  const db = leer();
  if (p.codigo_unico && db.atajaderos.some((a) => a.codigo_unico === p.codigo_unico)) {
    throw new ApiError(`El código ${p.codigo_unico} ya existe.`, 409);
  }
  const nuevo = nuevoSinValidar(db, {
    nombre_referencia: p.nombre_referencia.trim(),
    latitud: p.latitud,
    longitud: p.longitud,
    departamento: p.departamento,
    cuenca_riacho: p.cuenca_riacho.trim(),
    tipo_emplazamiento: p.tipo_emplazamiento,
    categoria_dato: p.categoria_dato,
    ...(p.codigo_unico ? { codigo_unico: p.codigo_unico } : {}),
  });
  db.atajaderos.push(nuevo);
  guardar(db);
  return { ...nuevo, inspecciones: [] };
}

export async function crearAviso(p: AvisoPayload): Promise<AvisoCreado> {
  await demora(500);
  // Emula la red: sin conexión el fetch real fallaría con TypeError.
  if (!navigator.onLine) throw new TypeError('Failed to fetch');
  const errores = validarAviso(p);
  if (Object.keys(errores).length) errorValidacion(errores);
  const db = leer();
  const nuevo = nuevoSinValidar(db, {
    nombre_referencia: p.nombre_referencia,
    latitud: p.latitud,
    longitud: p.longitud,
    departamento: p.departamento,
    cuenca_riacho: p.cuenca_riacho,
  });
  db.atajaderos.push(nuevo);
  guardar(db);
  return { codigo_unico: nuevo.codigo_unico };
}

// --- Inspecciones 1:N append-only ---

function agregarInspeccion(
  db: Almacen,
  a: AtajaderoSummary,
  p: InspeccionCreate,
  responsable: string,
  evidencia: { url: string; hash: string | null } | null,
): InspeccionResponse {
  const registro: InspeccionResponse = {
    id: `sim-${db.inspecciones.length + 1}-${Date.now()}`,
    atajadero_codigo: a.codigo_unico,
    fecha_inspeccion: ahoraLocalIso(),
    responsable,
    ...p,
    observaciones: p.observaciones.trim(),
    evidencia_fotos: evidencia ? [evidencia.url] : [],
    fotos_hashes_sha256: evidencia?.hash ? [evidencia.hash] : [],
  };
  db.inspecciones.push(registro);
  // El resumen refleja la última inspección; el código nunca cambia.
  a.estado = p.estado_observado;
  a.interrumpe_escurrimiento = p.interrumpe_escurrimiento;
  a.fecha_ultima_inspeccion = registro.fecha_inspeccion;
  a.total_inspecciones += 1;
  a.criterio_validado_por = responsable;
  return registro;
}

export async function crearInspeccion(
  codigo: string,
  p: InspeccionCreate,
  foto: File | null,
  responsable: string,
): Promise<InspeccionResponse> {
  await demora(400);
  const db = leer();
  const a = db.atajaderos.find((x) => x.codigo_unico === codigo);
  if (!a) throw new ApiError(`No existe el atajadero ${codigo}.`, 404);
  const errores = validarInspeccion(p);
  if (foto && !foto.type.startsWith('image/')) errores.foto = 'El archivo tiene que ser una imagen.';
  if (Object.keys(errores).length) errorValidacion(errores);
  const evidencia = foto
    ? { url: await fotoADataUrl(foto, 960, 0.7), hash: await sha256DeArchivo(foto) }
    : null;
  const registro = agregarInspeccion(db, a, p, responsable, evidencia);
  guardar(db);
  return registro;
}

// --- Importación KoboToolbox ---

export async function importarKobo(
  registros: KoboImportItem[],
  responsable: string,
): Promise<KoboImportResult> {
  await demora(500);
  if (!registros.length) {
    throw new ApiError('El lote está vacío: no hay registros para importar.', 422);
  }
  const db = leer();
  const resultado: KoboImportResult = { creados: 0, inspecciones_agregadas: 0, errores: [] };

  registros.forEach((r, i) => {
    const fila = `Registro ${i + 1}`;
    const existente = r.codigo_unico
      ? db.atajaderos.find((a) => a.codigo_unico === r.codigo_unico)
      : undefined;

    if (existente) {
      if (!r.estado_observado || !r.interrumpe_escurrimiento) {
        resultado.errores.push(`${fila}: ${r.codigo_unico} ya existe y no trae estado para agregar una inspección.`);
        return;
      }
      const inspeccion: InspeccionCreate = {
        tipo_registro: 'inspeccion',
        estado_observado: r.estado_observado,
        interrumpe_escurrimiento: r.interrumpe_escurrimiento,
        indicadores_visuales: r.indicadores_visuales ?? [],
        observaciones: r.observaciones ?? '',
      };
      const errores = validarInspeccion(inspeccion);
      if (Object.keys(errores).length) {
        resultado.errores.push(`${fila}: ${Object.values(errores).join(' ')}`);
        return;
      }
      agregarInspeccion(db, existente, inspeccion, `${responsable} (importado de Kobo)`, null);
      resultado.inspecciones_agregadas += 1;
      return;
    }

    if (!r.nombre_referencia?.trim()) {
      resultado.errores.push(`${fila}: falta nombre_referencia.`);
      return;
    }
    if (!dentroDeFormosa(Number(r.latitud), Number(r.longitud))) {
      resultado.errores.push(`${fila}: ${MENSAJE_FUERA_DE_FORMOSA}`);
      return;
    }
    db.atajaderos.push(
      nuevoSinValidar(db, {
        nombre_referencia: r.nombre_referencia.trim(),
        latitud: Number(r.latitud),
        longitud: Number(r.longitud),
        departamento: r.departamento ?? 'A determinar',
        cuenca_riacho: r.cuenca_riacho ?? 'A determinar',
        tipo_emplazamiento: r.tipo_emplazamiento ?? 'a_determinar',
      }),
    );
    resultado.creados += 1;
  });

  guardar(db);
  return resultado;
}

// --- Asistente (modo determinístico offline, solo lectura) ---

const AVISO_LEGAL =
  'Borrador generado por reglas locales (modo determinístico offline). No asigna estados ni guarda datos: requiere confirmación humana del responsable (Decreto-Ley N° 971/1980).';

const PATRONES: [IndicadorVisual, RegExp][] = [
  ['cierre_total_sin_vertedero', /(cierre|cerrad|sin vertedero|sin paso|tapad[oa] .*cauce)/],
  ['riesgo_sobrepaso_borde_libre', /(sobrepas|borde libre|desbord|rebals|al tope|coronamiento)/],
  ['filtracion_turbia_tubificacion', /(filtra|turbi|barro|tubific)/],
  ['grietas_o_bioperturbacion', /(griet|fisur|cueva|vizcach|hormig|hundim)/],
  ['alcantarilla_obstruida', /(alcantarill|caño|cano).{0,40}(tapad|obstru|sediment|rama)/],
];

function estructurarNota(texto: string): AsistenteResponse {
  const t = texto.toLowerCase();
  const indicadores = PATRONES.filter(([, re]) => re.test(t)).map(([v]) => v);

  let escurrimiento: InterrupcionEscurrimiento = 'a_verificar';
  if (/(no (corre|pasa)|sin paso|no hay paso|bloque|acumula)/.test(t) ||
      indicadores.includes('cierre_total_sin_vertedero')) {
    escurrimiento = 'si';
  } else if (/(corre normal|pasa (bien|normal)|paso libre|vertedero libre)/.test(t)) {
    escurrimiento = 'no';
  }

  let estado: EstadoAtajadero | null = null;
  if (/(colaps|roto|rompi|removid|derrumb)/.test(t)) estado = 'fuera_de_servicio';
  else if (indicadores.length) estado = 'con_deterioro';
  else if (/(buen estado|íntegr|integr|sin novedad)/.test(t)) estado = 'operativo';

  const limpio = texto.trim().replace(/\s+/g, ' ');
  const oracion = limpio.charAt(0).toUpperCase() + limpio.slice(1);
  return {
    modo_ejecucion: 'deterministico_offline',
    requiere_confirmacion_humana: true,
    aviso_legal: AVISO_LEGAL,
    resumen_tecnico: /[.!?]$/.test(oracion) ? oracion : `${oracion}.`,
    indicadores_sugeridos: indicadores,
    estado_sugerido: estado,
    escurrimiento_sugerido: escurrimiento,
    encuadre_normativo:
      escurrimiento === 'si'
        ? ['Ley N° 1.314, Art. 40°: verificar si la obra está sobre una corriente activa.']
        : [],
  };
}

function resumirTriage(db: Almacen, codigo?: string): AsistenteResponse {
  const base = {
    modo_ejecucion: 'deterministico_offline' as const,
    requiere_confirmacion_humana: true as const,
    aviso_legal: AVISO_LEGAL,
    indicadores_sugeridos: [] as IndicadorVisual[],
    encuadre_normativo: [] as string[],
  };

  if (codigo) {
    const a = db.atajaderos.find((x) => x.codigo_unico === codigo);
    if (!a) throw new ApiError(`No existe el atajadero ${codigo}.`, 404);
    const hist = db.inspecciones
      .filter((i) => i.atajadero_codigo === codigo)
      .sort((x, y) => x.fecha_inspeccion.localeCompare(y.fecha_inspeccion));
    const intervenciones = hist.filter((i) => i.tipo_registro === 'intervencion').length;
    const ultima = hist.at(-1);
    return {
      ...base,
      resumen_tecnico: ultima
        ? `${codigo} registra ${hist.length} ${hist.length === 1 ? 'registro' : 'registros'} (${intervenciones} ${intervenciones === 1 ? 'intervención' : 'intervenciones'}). La última lectura (${ultima.fecha_inspeccion.slice(0, 10)}) indica estado "${ultima.estado_observado.replace(/_/g, ' ')}" y escurrimiento "${ultima.interrumpe_escurrimiento.replace('_', ' ')}".`
        : `${codigo} no tiene inspecciones presenciales: es un registro preliminar sin validar.`,
      indicadores_sugeridos: ultima?.indicadores_visuales ?? [],
    };
  }

  const bloqueos = db.atajaderos.filter(
    (a) => a.interrumpe_escurrimiento === 'si' && a.estado !== 'fuera_de_servicio',
  );
  const sinInspeccion = db.atajaderos.filter((a) => a.estado === 'sin_validar');
  return {
    ...base,
    resumen_tecnico:
      `Inventario de ${db.atajaderos.length} atajaderos. ${bloqueos.length} con bloqueo activo del escurrimiento` +
      (bloqueos.length ? ` (${bloqueos.map((a) => a.codigo_unico).join(', ')})` : '') +
      `; ${sinInspeccion.length} sin inspección presencial. Sugerencia de orden: primero los bloqueos activos en cauce, después los avisos sin validar.`,
    encuadre_normativo: bloqueos.length
      ? ['Ley N° 1.314, Art. 40°: prioridad a obras sobre corrientes activas.']
      : [],
  };
}

export async function asistente(req: AsistenteRequest): Promise<AsistenteResponse> {
  await demora(600);
  if (req.modo === 'estructurar_nota_campo') {
    if (!req.texto_campo || req.texto_campo.trim().length < MIN_CARACTERES_OBSERVACIONES) {
      throw new ApiError('Escribí una nota de campo un poco más larga para estructurarla.', 422);
    }
    return estructurarNota(req.texto_campo);
  }
  return resumirTriage(leer(), req.codigo_unico);
}
