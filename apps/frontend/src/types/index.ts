export type UserRole = 'inspector' | 'referente_mesa';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface HealthResponse {
  status: string;
  es_prototipo: boolean;
  leyenda: string;
  proyecto: string;
  ia_modo: 'ia_asistida' | 'deterministico_offline';
}

// --- Espejo de StrEnums de 00_CORE_CONTRACTS.md (valores exactos) ---

export type EstadoAtajadero =
  | 'sin_validar'
  | 'operativo'
  | 'con_deterioro'
  | 'fuera_de_servicio';

export type InterrupcionEscurrimiento = 'si' | 'no' | 'a_verificar';

export type TipoEmplazamiento =
  | 'en_cauce_activo'
  | 'lateral_fuera_de_cauce'
  | 'alcantarilla_vial'
  | 'a_determinar';

export type CategoriaDato = 'SIMULADO' | 'OBSERVADO' | 'REFERENCIA';

export type TipoRegistro = 'inspeccion' | 'intervencion';

export type IndicadorVisual =
  | 'cierre_total_sin_vertedero'
  | 'riesgo_sobrepaso_borde_libre'
  | 'filtracion_turbia_tubificacion'
  | 'grietas_o_bioperturbacion'
  | 'alcantarilla_obstruida';

// --- Recursos del contrato REST ---

export interface AtajaderoSummary {
  codigo_unico: string;
  nombre_referencia: string;
  latitud: number;
  longitud: number;
  departamento: string;
  cuenca_riacho: string;
  tipo_emplazamiento: TipoEmplazamiento;
  estado: EstadoAtajadero;
  interrumpe_escurrimiento: InterrupcionEscurrimiento;
  categoria_dato: CategoriaDato;
  criterio_validado_por: string | null;
  fecha_ultima_inspeccion: string | null;
  total_inspecciones: number;
}

export interface InspeccionResponse {
  id: number;
  atajadero_codigo: string;
  fecha_inspeccion: string;
  responsable: string;
  tipo_registro: TipoRegistro;
  estado_observado: EstadoAtajadero;
  interrumpe_escurrimiento: InterrupcionEscurrimiento;
  indicadores_visuales: IndicadorVisual[];
  observaciones: string;
  evidencia_fotos: string[];
  fotos_hashes_sha256: string[];
}

export interface AtajaderoDetail extends AtajaderoSummary {
  inspecciones: InspeccionResponse[];
}

export interface AtajaderoListResponse {
  total: number;
  items: AtajaderoSummary[];
}

export interface FiltrosAtajaderos {
  estado?: EstadoAtajadero;
  interrumpe_escurrimiento?: InterrupcionEscurrimiento;
  tipo_emplazamiento?: TipoEmplazamiento;
  departamento?: string;
  cuenca_riacho?: string;
  q?: string;
}
