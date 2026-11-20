import {
  AtajaderoSummary,
  EstadoAtajadero,
  IndicadorVisual,
  InterrupcionEscurrimiento,
  TipoEmplazamiento,
  TipoRegistro,
} from '@/types';

// Textos de interfaz y criterios escritos (00_CORE_CONTRACTS.md §2).

export const ETIQUETA_ESCURRIMIENTO: Record<InterrupcionEscurrimiento, string> = {
  si: 'Interrumpe',
  a_verificar: 'A verificar',
  no: 'No interrumpe',
};

export const ETIQUETA_ESTADO: Record<EstadoAtajadero, string> = {
  sin_validar: 'Sin validar',
  operativo: 'Operativo',
  con_deterioro: 'Con deterioro',
  fuera_de_servicio: 'Fuera de servicio',
};

export const CRITERIO_ESTADO: Record<EstadoAtajadero, string> = {
  sin_validar:
    'Registro preliminar (aviso vecinal, denuncia o indicio satelital) sin visita presencial.',
  operativo:
    'Estructura íntegra con paso o vertedero funcional en la última inspección.',
  con_deterioro:
    'Erosión, pérdida de borde libre, colmatación o falta de vertedero.',
  fuera_de_servicio: 'Obra colapsada, removida o inhabilitada.',
};

export const ETIQUETA_EMPLAZAMIENTO: Record<TipoEmplazamiento, string> = {
  en_cauce_activo: 'En cauce activo',
  lateral_fuera_de_cauce: 'Lateral fuera de cauce',
  alcantarilla_vial: 'Alcantarilla vial',
  a_determinar: 'A determinar',
};

export const DEPARTAMENTOS_FORMOSA = [
  'Bermejo',
  'Formosa',
  'Laishí',
  'Matacos',
  'Patiño',
  'Pilagás',
  'Pilcomayo',
  'Pirané',
  'Ramón Lista',
];

// Encuadre normativo por emplazamiento (00_CORE_CONTRACTS.md §2, TipoEmplazamiento).
export const ENCUADRE_EMPLAZAMIENTO: Record<TipoEmplazamiento, string> = {
  en_cauce_activo: 'Ley N° 1.314, Art. 40°: prohibición de obras sobre corrientes activas.',
  lateral_fuera_de_cauce: 'Ley N° 1.246, Art. 88°: Registro de Atajaderos laterales.',
  alcantarilla_vial: 'Obra vial: corresponde dar aviso a Vialidad (DPV).',
  a_determinar: 'Emplazamiento a determinar en la inspección presencial.',
};

export const ETIQUETA_TIPO_REGISTRO: Record<TipoRegistro, string> = {
  inspeccion: 'Inspección',
  intervencion: 'Intervención',
};

export const DESCRIPCION_TIPO_REGISTRO: Record<TipoRegistro, string> = {
  inspeccion: 'Relevamiento técnico presencial del estado de la obra.',
  intervencion:
    'Intimación formal, apertura de aliviadero, limpieza o remoción mecánica.',
};

// Una inspección asigna un estado técnico validado; nunca vuelve a sin_validar
// (00_CORE_CONTRACTS.md §3: esa transición da 422).
export const ESTADOS_INSPECCION: EstadoAtajadero[] = [
  'operativo',
  'con_deterioro',
  'fuera_de_servicio',
];

// Protocolo FAO Paper 64 / ASDSO / FHWA: patologías visibles a simple vista.
export const INDICADORES_VISUALES: {
  valor: IndicadorVisual;
  etiqueta: string;
  descripcion: string;
}[] = [
  {
    valor: 'cierre_total_sin_vertedero',
    etiqueta: 'Cierre total sin vertedero',
    descripcion: 'El terraplén cruza todo el cauce y no tiene paso para el agua.',
  },
  {
    valor: 'riesgo_sobrepaso_borde_libre',
    etiqueta: 'Riesgo de sobrepaso',
    descripcion: 'El agua está cerca del coronamiento (poco borde libre).',
  },
  {
    valor: 'filtracion_turbia_tubificacion',
    etiqueta: 'Filtración turbia',
    descripcion: 'Sale agua con barro aguas abajo: posible tubificación.',
  },
  {
    valor: 'grietas_o_bioperturbacion',
    etiqueta: 'Grietas o cuevas',
    descripcion: 'Fisuras, hundimientos o cuevas de animales en el terraplén.',
  },
  {
    valor: 'alcantarilla_obstruida',
    etiqueta: 'Alcantarilla obstruida',
    descripcion: 'La alcantarilla o el caño de paso está tapado.',
  },
];

export const ETIQUETA_INDICADOR = Object.fromEntries(
  INDICADORES_VISUALES.map((i) => [i.valor, i.etiqueta]),
) as Record<IndicadorVisual, string>;

// Clases Tailwind por valor de escurrimiento (tinte + texto oscuro de la misma familia).
export const CLASES_ESCURRIMIENTO: Record<InterrupcionEscurrimiento, string> = {
  si: 'bg-red-50 text-red-800 border-red-200',
  a_verificar: 'bg-amber-50 text-amber-900 border-amber-200',
  no: 'bg-green-50 text-green-800 border-green-200',
};

// --- Transparencia temporal (RF-FE-03) ---

export const DIAS_LECTURA_REZAGADA = 14;
const MS_POR_DIA = 86_400_000;

export type EstadoLectura = 'sin_lectura' | 'rezagada' | 'al_dia';

export function diasDesde(fechaIso: string, hoy = new Date()): number {
  return Math.floor((hoy.getTime() - new Date(fechaIso).getTime()) / MS_POR_DIA);
}

export function estadoLectura(fecha: string | null): EstadoLectura {
  if (!fecha) return 'sin_lectura';
  return diasDesde(fecha) > DIAS_LECTURA_REZAGADA ? 'rezagada' : 'al_dia';
}

export function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// --- Cola "Requiere decisión" ---

export type MotivoDecision = 'bloqueo_activo' | 'sin_inspeccion' | 'rezagada';

export interface ItemDecision {
  atajadero: AtajaderoSummary;
  motivo: MotivoDecision;
  titulo: string;
  detalle: string;
}

// Orden de prioridad: primero lo que bloquea el agua, después lo que nadie fue a ver.
const PRIORIDAD: Record<MotivoDecision, number> = {
  bloqueo_activo: 0,
  sin_inspeccion: 1,
  rezagada: 2,
};

export function armarColaDecisiones(
  atajaderos: AtajaderoSummary[],
): ItemDecision[] {
  const cola: ItemDecision[] = [];
  atajaderos.forEach((a) => {
    const lectura = estadoLectura(a.fecha_ultima_inspeccion);
    if (a.interrumpe_escurrimiento === 'si' && a.estado !== 'fuera_de_servicio') {
      cola.push({
        atajadero: a,
        motivo: 'bloqueo_activo',
        titulo: 'Bloqueo activo del escurrimiento',
        detalle: 'Evaluar intervención (apertura de aliviadero o intimación).',
      });
    } else if (a.estado === 'sin_validar') {
      cola.push({
        atajadero: a,
        motivo: 'sin_inspeccion',
        titulo: 'Sin inspección presencial',
        detalle: 'Asignar una inspección de verificación en campo.',
      });
    } else if (lectura === 'rezagada' && a.fecha_ultima_inspeccion) {
      cola.push({
        atajadero: a,
        motivo: 'rezagada',
        titulo: `Lectura rezagada · ${diasDesde(a.fecha_ultima_inspeccion)} días`,
        detalle: 'Programar una nueva inspección para actualizar el dato.',
      });
    }
  });
  return cola.sort((x, y) => PRIORIDAD[x.motivo] - PRIORIDAD[y.motivo]);
}
