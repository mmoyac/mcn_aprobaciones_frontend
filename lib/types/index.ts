// Tipos para autenticación
export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: string;
  nombre: string;
}

// Tipos para presupuestos
export interface PresupuestoIndicadores {
  pendientes: number;
  aprobados: number;
}

export interface PresupuestoDetalle {
  Loc_cod: number;
  pre_nro: number;
  pre_est: string;
  pre_fec: string;
  pre_rut: number;
  pre_VenCod: number;
  Pre_Neto: number;
  Pre_vbLib: number;
  pre_vbgg: number;
  pre_gl1: string;
  pre_fecAdj: string;
  pre_VbLibUsu?: string;
  Pre_VBLibDt?: string;
  pre_vbggUsu?: string;
  pre_vbggDt?: string;
  pre_trnFec: string;
  pre_trnusu: string;
}

export interface PresupuestoAprobar {
  Loc_cod: number;
  pre_nro: number;
}

export interface PresupuestoAprobadoResponse {
  success: boolean;
  message: string;
  Loc_cod: number;
  pre_nro: number;
  pre_vbggUsu: string;
  pre_vbggDt: string;
  pre_vbggTime: string;
}

// Tipos para usuarios
export interface Usuario {
  UserCd: string;
  UserDs: string;
  UserCta: number;
  UserParam: number;
  UserMaes: number;
  UserMovi: number;
  UserUti: number;
  UserCon: number;
  UserPerf: number;
  UserFolDte: string;
  UserDte: number;
  UserChPass: string;
  UserNameMail: string;
  UserMail: string;
  UserGAMGUID: string;
}
