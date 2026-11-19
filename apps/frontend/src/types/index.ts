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
