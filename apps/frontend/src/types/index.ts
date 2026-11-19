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
  // Campos que agrega el backend real (opcionales: el mock no los tiene).
  id?: string;
  observaciones_iniciales?: string | null;
  reportado_por?: string | null;
  fuente_referencia?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InspeccionResponse {
  // UUID en el backend real.
  id: string;
  atajadero_id?: string;
  atajadero_codigo?: string;
  inspector_id?: number | null;
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
  // Foto del aviso vecinal que dio de alta el registro (POST /api/avisos).
  evidencia_inicial_fotos?: string[];
  evidencia_inicial_hashes_sha256?: string[];
}

export interface AtajaderoListResponse {
  total: number;
  items: AtajaderoSummary[];
}

// POST /api/avisos (público, Forma B)
export interface AvisoPayload {
  nombre_referencia: string;
  latitud: number;
  longitud: number;
  departamento: string;
  cuenca_riacho: string;
  descripcion_aviso: string;
  reportado_por?: string;
}

export interface AvisoCreado {
  codigo_unico: string;
}

// POST /api/atajaderos
export interface AtajaderoCreate {
  nombre_referencia: string;
  latitud: number;
  longitud: number;
  departamento: string;
  cuenca_riacho: string;
  tipo_emplazamiento: TipoEmplazamiento;
  categoria_dato: CategoriaDato;
  estado?: EstadoAtajadero;
  interrumpe_escurrimiento?: InterrupcionEscurrimiento;
  codigo_unico?: string;
  criterio_validado_por?: string;
}

// POST /api/atajaderos/{codigo_unico}/inspecciones
export interface InspeccionCreate {
  tipo_registro: TipoRegistro;
  estado_observado: EstadoAtajadero;
  interrumpe_escurrimiento: InterrupcionEscurrimiento;
  indicadores_visuales: IndicadorVisual[];
  observaciones: string;
}

// POST /api/atajaderos/importar-kobo
export interface KoboImportItem {
  nombre_referencia: string;
  latitud: number;
  longitud: number;
  departamento?: string;
  cuenca_riacho?: string;
  tipo_emplazamiento?: TipoEmplazamiento;
  codigo_unico?: string;
  // Si trae codigo_unico existente + estado + observaciones, se agrega como inspección.
  estado_observado?: EstadoAtajadero;
  interrumpe_escurrimiento?: InterrupcionEscurrimiento;
  indicadores_visuales?: IndicadorVisual[];
  observaciones?: string;
}

// La interfaz siempre recibe los errores ya como texto (api.ts normaliza).
export interface KoboImportResult {
  creados: number;
  inspecciones_agregadas: number;
  errores: string[];
  codigos_procesados?: string[];
}

// Forma real de cada error del backend en POST /api/atajaderos/importar-kobo.
export interface KoboImportErrorApi {
  indice: number;
  codigo_unico: string | null;
  detalle: string;
}

// POST /api/asistente/resumir (solo lectura respecto a la base de datos)
export type ModoAsistente = 'estructurar_nota_campo' | 'resumir_triage_mesa';

export interface AsistenteRequest {
  modo: ModoAsistente;
  texto_campo?: string;
  codigo_unico?: string;
}

export interface AsistenteResponse {
  modo_ejecucion: 'ia_asistida' | 'deterministico_offline';
  requiere_confirmacion_humana: true;
  aviso_legal: string;
  resumen_tecnico: string;
  indicadores_sugeridos: IndicadorVisual[];
  estado_sugerido?: EstadoAtajadero | null;
  escurrimiento_sugerido?: InterrupcionEscurrimiento | null;
  encuadre_normativo: string[];
}

export interface FiltrosAtajaderos {
  estado?: EstadoAtajadero;
  interrumpe_escurrimiento?: InterrupcionEscurrimiento;
  tipo_emplazamiento?: TipoEmplazamiento;
  departamento?: string;
  cuenca_riacho?: string;
  q?: string;
}
