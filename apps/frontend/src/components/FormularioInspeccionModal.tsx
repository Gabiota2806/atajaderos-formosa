import CodigoAtajadero from '@/components/CodigoAtajadero';
import CopilotoIaPanel from '@/components/CopilotoIaPanel';
import { COLOR_ESCURRIMIENTO } from '@/components/MapaAtajaderos';
import Modal from '@/components/Modal';
import {
  ApiError,
  crearInspeccion,
  MIN_CARACTERES_OBSERVACIONES,
  validarInspeccion,
} from '@/lib/api';
import {
  CRITERIO_ESTADO,
  DESCRIPCION_TIPO_REGISTRO,
  ESTADOS_INSPECCION,
  ETIQUETA_ESCURRIMIENTO,
  ETIQUETA_ESTADO,
  ETIQUETA_INDICADOR,
  ETIQUETA_TIPO_REGISTRO,
  INDICADORES_VISUALES,
} from '@/lib/dominio';
import { sha256DeArchivo } from '@/lib/imagenes';
import {
  AsistenteResponse,
  AtajaderoSummary,
  EstadoAtajadero,
  IndicadorVisual,
  InspeccionResponse,
  InterrupcionEscurrimiento,
  TipoRegistro,
} from '@/types';
import {
  CameraIcon,
  CheckIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ReactNode, useEffect, useRef, useState } from 'react';

const PASOS = ['Registro', 'Foto', 'Escurrimiento', 'Qué ves', 'Estado', 'Observaciones', 'Revisar'];

const OPCIONES_ESCURRIMIENTO: { valor: InterrupcionEscurrimiento; titulo: string; detalle: string }[] = [
  { valor: 'si', titulo: 'Sí, interrumpe', detalle: 'El agua no pasa o pasa muy poco aguas abajo.' },
  { valor: 'a_verificar', titulo: 'No estoy seguro', detalle: 'Queda marcado como "a verificar".' },
  { valor: 'no', titulo: 'No interrumpe', detalle: 'El agua corre normalmente.' },
];

// Distancia en metros entre dos coordenadas (fórmula de haversine).
function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Opcion({
  activa,
  onClick,
  titulo,
  detalle,
  marca,
}: {
  activa: boolean;
  onClick: () => void;
  titulo: string;
  detalle?: string;
  marca?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`flex min-h-[56px] w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
        activa
          ? 'border-2 border-teal-700 bg-teal-50 text-teal-950'
          : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
      }`}
    >
      {marca}
      <span>
        <span className="block text-[15px] font-semibold">{titulo}</span>
        {detalle && (
          <span className={`mt-0.5 block text-sm ${activa ? 'text-teal-900' : 'text-slate-600'}`}>
            {detalle}
          </span>
        )}
      </span>
    </button>
  );
}

interface FormularioInspeccionModalProps {
  atajadero: AtajaderoSummary;
  responsable: string;
  onCerrar: () => void;
  onGuardado: (registro: InspeccionResponse) => void;
}

export default function FormularioInspeccionModal({
  atajadero: a,
  responsable,
  onCerrar,
  onGuardado,
}: FormularioInspeccionModalProps) {
  const [paso, setPaso] = useState(0);
  const [tipo, setTipo] = useState<TipoRegistro>('inspeccion');
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [hashFoto, setHashFoto] = useState<string | null>(null);
  const [escurrimiento, setEscurrimiento] = useState<InterrupcionEscurrimiento | null>(null);
  const [indicadores, setIndicadores] = useState<IndicadorVisual[]>([]);
  const [estado, setEstado] = useState<EstadoAtajadero | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [desdeBorrador, setDesdeBorrador] = useState(false);

  const [gps, setGps] = useState<{ estado: 'inactivo' | 'buscando' | 'ok' | 'error'; metros?: number }>({
    estado: 'inactivo',
  });
  const [error, setError] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const ahora = useRef(new Date()).current;

  useEffect(() => {
    if (!foto) {
      setVistaPrevia(null);
      setHashFoto(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setVistaPrevia(url);
    void sha256DeArchivo(foto).then(setHashFoto);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const verificarUbicacion = () => {
    if (!('geolocation' in navigator)) {
      setGps({ estado: 'error' });
      return;
    }
    setGps({ estado: 'buscando' });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGps({
          estado: 'ok',
          metros: distanciaMetros(pos.coords.latitude, pos.coords.longitude, a.latitud, a.longitud),
        }),
      () => setGps({ estado: 'error' }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  // Validación por paso: no se avanza sin el dato obligatorio.
  const errorDelPaso = (): string | null => {
    if (paso === 1 && tipo === 'inspeccion' && !foto) {
      return 'Una inspección necesita al menos una foto de evidencia.';
    }
    if (paso === 2 && !escurrimiento) {
      return 'Elegí una opción. Si no estás seguro, marcá "No estoy seguro".';
    }
    if (paso === 4 && !estado) return 'Elegí el estado según el criterio escrito.';
    if (paso === 5 && observaciones.trim().length < MIN_CARACTERES_OBSERVACIONES) {
      return `Las observaciones necesitan al menos ${MIN_CARACTERES_OBSERVACIONES} caracteres.`;
    }
    return null;
  };

  const avanzar = () => {
    const e = errorDelPaso();
    setError(e);
    if (!e) setPaso((p) => p + 1);
  };

  const aplicarBorrador = (b: AsistenteResponse) => {
    setObservaciones(b.resumen_tecnico);
    setIndicadores((previos) => [...new Set([...previos, ...b.indicadores_sugeridos])]);
    if (b.escurrimiento_sugerido) setEscurrimiento(b.escurrimiento_sugerido);
    if (b.estado_sugerido && b.estado_sugerido !== 'sin_validar') setEstado(b.estado_sugerido);
    setDesdeBorrador(true);
    setError(null);
  };

  const guardar = async () => {
    if (!escurrimiento || !estado) return;
    const payload = {
      tipo_registro: tipo,
      estado_observado: estado,
      interrumpe_escurrimiento: escurrimiento,
      indicadores_visuales: indicadores,
      observaciones: observaciones.trim(),
    };
    const errores = validarInspeccion(payload);
    if (Object.keys(errores).length) {
      setErrorServidor(Object.values(errores).join(' '));
      return;
    }
    setGuardando(true);
    setErrorServidor(null);
    try {
      onGuardado(await crearInspeccion(a.codigo_unico, payload, foto, responsable));
    } catch (e) {
      // 422 u otro error: los datos quedan cargados para corregir.
      setErrorServidor(
        e instanceof ApiError || e instanceof Error ? e.message : 'No se pudo guardar.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const restantes = Math.max(0, MIN_CARACTERES_OBSERVACIONES - observaciones.trim().length);

  const contenido = (() => {
    switch (paso) {
      case 0:
        return (
          <>
            <h3 className="text-xl font-semibold">¿Qué vas a registrar?</h3>
            <div className="space-y-2">
              {(['inspeccion', 'intervencion'] as TipoRegistro[]).map((t) => (
                <Opcion
                  key={t}
                  activa={tipo === t}
                  onClick={() => setTipo(t)}
                  titulo={ETIQUETA_TIPO_REGISTRO[t]}
                  detalle={DESCRIPCION_TIPO_REGISTRO[t]}
                />
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="font-medium text-slate-900">{a.nombre_referencia}</p>
              <p className="text-sm text-slate-600">
                {a.cuenca_riacho} · Dpto. {a.departamento}
              </p>
              <button
                type="button"
                onClick={verificarUbicacion}
                disabled={gps.estado === 'buscando'}
                className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                {gps.estado === 'buscando' ? 'Buscando…' : '¿Estoy en el lugar?'}
              </button>
              {gps.estado === 'ok' && gps.metros !== undefined && (
                <p className={`mt-1.5 text-sm ${gps.metros <= 500 ? 'text-green-800' : 'text-amber-900'}`}>
                  Estás a {gps.metros < 1000 ? `${Math.round(gps.metros)} m` : `${(gps.metros / 1000).toFixed(1)} km`} del
                  atajadero{gps.metros > 500 && '. Verificá que sea el correcto.'}
                </p>
              )}
              {gps.estado === 'error' && (
                <p className="mt-1.5 text-sm text-amber-900">
                  No se pudo obtener la ubicación. Podés seguir igual.
                </p>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Responsable: {responsable} ·{' '}
              {ahora.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23' })}
            </p>
          </>
        );
      case 1:
        return (
          <>
            <h3 className="text-xl font-semibold">Foto de evidencia</h3>
            <p className="text-sm text-slate-600">
              {tipo === 'inspeccion'
                ? 'Obligatoria. Idealmente el terraplén con el cauce aguas abajo.'
                : 'Opcional para intervenciones.'}
            </p>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo && !archivo.type.startsWith('image/')) {
                  setError('El archivo tiene que ser una imagen.');
                  return;
                }
                setError(null);
                setFoto(archivo ?? null);
              }}
            />
            {vistaPrevia ? (
              <div>
                <div className="relative">
                  <img src={vistaPrevia} alt="Foto de evidencia" className="max-h-72 w-full rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFoto(null);
                      if (inputFotoRef.current) inputFotoRef.current.value = '';
                    }}
                    className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
                    aria-label="Quitar foto"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-1.5 break-all font-mono text-[11px] text-slate-500">
                  {hashFoto ? `Sello SHA-256: ${hashFoto}` : 'Calculando sello SHA-256…'}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <CameraIcon className="h-8 w-8" aria-hidden="true" />
                Sacar o elegir una foto
              </button>
            )}
          </>
        );
      case 2:
        return (
          <>
            <h3 className="text-xl font-semibold">¿Interrumpe el escurrimiento?</h3>
            <p className="text-sm text-slate-600">Es el dato más importante frente a El Niño.</p>
            <div className="space-y-2">
              {OPCIONES_ESCURRIMIENTO.map((o) => (
                <Opcion
                  key={o.valor}
                  activa={escurrimiento === o.valor}
                  onClick={() => {
                    setEscurrimiento(o.valor);
                    setError(null);
                  }}
                  titulo={o.titulo}
                  detalle={o.detalle}
                  marca={
                    <span
                      className="mt-0.5 h-5 w-5 shrink-0 rounded-full"
                      style={{ backgroundColor: COLOR_ESCURRIMIENTO[o.valor] }}
                      aria-hidden="true"
                    />
                  }
                />
              ))}
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h3 className="text-xl font-semibold">¿Qué ves en la obra?</h3>
            <p className="text-sm text-slate-600">
              Marcá todas las que apliquen (protocolo FAO / ASDSO / FHWA). Si no ves ninguna,
              seguí.
            </p>
            <div className="space-y-2">
              {INDICADORES_VISUALES.map((i) => {
                const activo = indicadores.includes(i.valor);
                return (
                  <Opcion
                    key={i.valor}
                    activa={activo}
                    onClick={() =>
                      setIndicadores((prev) =>
                        activo ? prev.filter((v) => v !== i.valor) : [...prev, i.valor],
                      )
                    }
                    titulo={i.etiqueta}
                    detalle={i.descripcion}
                    marca={
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          activo ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-400 bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        {activo && <CheckIcon className="h-3.5 w-3.5" />}
                      </span>
                    }
                  />
                );
              })}
            </div>
          </>
        );
      case 4:
        return (
          <>
            <h3 className="text-xl font-semibold">¿En qué estado está?</h3>
            <p className="text-sm text-slate-600">Elegí según el criterio escrito.</p>
            <div className="space-y-2">
              {ESTADOS_INSPECCION.map((e) => (
                <Opcion
                  key={e}
                  activa={estado === e}
                  onClick={() => {
                    setEstado(e);
                    setError(null);
                  }}
                  titulo={ETIQUETA_ESTADO[e]}
                  detalle={CRITERIO_ESTADO[e]}
                />
              ))}
            </div>
          </>
        );
      case 5:
        return (
          <>
            <h3 className="text-xl font-semibold">Observaciones</h3>
            <p className="text-sm text-slate-600">
              Escribí rápido lo que viste; el copiloto puede ordenarlo como borrador.
            </p>
            <textarea
              rows={5}
              value={observaciones}
              onChange={(e) => {
                setObservaciones(e.target.value);
                setDesdeBorrador(false);
              }}
              placeholder="terraplen cerrado sin alcantarilla, agua acumulada arriba"
              className="w-full rounded-xl border border-slate-300 p-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
            <p className="text-xs text-slate-500">
              {restantes > 0 ? `Faltan ${restantes} caracteres como mínimo.` : 'Listo.'}
              {desdeBorrador && ' Texto aplicado desde el borrador del copiloto: revisalo.'}
            </p>
            <CopilotoIaPanel
              modo="estructurar_nota_campo"
              textoCampo={observaciones}
              codigoUnico={a.codigo_unico}
              onAplicar={aplicarBorrador}
            />
          </>
        );
      default:
        return (
          <>
            <h3 className="text-xl font-semibold">Revisá antes de guardar</h3>
            <p className="text-sm text-slate-600">
              Después no se edita: queda en el historial. Si algo cambia, se registra una
              inspección nueva.
            </p>
            <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
              {[
                ['Tipo', ETIQUETA_TIPO_REGISTRO[tipo]],
                ['Escurrimiento', escurrimiento ? ETIQUETA_ESCURRIMIENTO[escurrimiento] : '—'],
                ['Estado', estado ? ETIQUETA_ESTADO[estado] : '—'],
                [
                  'Indicadores',
                  indicadores.length ? indicadores.map((i) => ETIQUETA_INDICADOR[i]).join(', ') : 'Ninguno',
                ],
                ['Foto', foto ? 'Adjunta con sello SHA-256' : 'Sin foto'],
                ['Observaciones', observaciones.trim()],
                ['Responsable', responsable],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 px-3 py-2.5">
                  <dt className="w-28 shrink-0 text-slate-500">{k}</dt>
                  <dd className="min-w-0 flex-1 break-words text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            {errorServidor && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-semibold">No se pudo guardar</p>
                <p className="mt-1">{errorServidor}</p>
                <p className="mt-1">Tus datos siguen cargados: volvé al paso correspondiente y corregilos.</p>
              </div>
            )}
          </>
        );
    }
  })();

  return (
    <Modal
      ancho="md"
      onCerrar={onCerrar}
      titulo={
        <div>
          <div className="flex items-center gap-2">
            <CodigoAtajadero codigo={a.codigo_unico} />
            <span className="text-xs text-slate-500">
              Paso {paso + 1} de {PASOS.length} · {PASOS[paso]}
            </span>
          </div>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {PASOS.map((p, i) => (
              <span key={p} className={`h-1 flex-1 rounded-full ${i <= paso ? 'bg-teal-700' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      }
      pie={
        <div className="flex gap-2">
          {paso > 0 && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setPaso((p) => p - 1);
              }}
              className="min-h-[50px] w-28 rounded-xl border border-slate-300 text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Atrás
            </button>
          )}
          {paso < PASOS.length - 1 ? (
            <button
              type="button"
              onClick={avanzar}
              className="min-h-[50px] flex-1 rounded-xl bg-teal-700 text-base font-semibold text-white hover:bg-teal-800"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={guardando}
              className="min-h-[50px] flex-1 rounded-xl bg-teal-700 text-base font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : 'Confirmar y guardar'}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4 p-4 sm:p-5">
        {contenido}
        {error && (
          <p role="alert" className="flex items-start gap-1.5 text-sm text-red-700">
            <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
