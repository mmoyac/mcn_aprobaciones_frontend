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
  cliente_nombre: string;
  pre_VenCod: number;
  Pre_Neto: number;
  Pre_vbLib: number;
  pre_vbgg: number;
  pre_gl1: string;
  pre_fecAdj: string;
  sol_nro: number;
  pre_ref: string;
  pre_VbLibUsu?: string;
  Pre_VBLibDt?: string;
  pre_vbggUsu?: string;
  pre_vbggDt?: string;
  pre_trnFec: string;
  pre_trnusu: string;
  tienepdf?: number; // 0 = no existe, 1 = tiene PDF, 2 = existe sin contenido
  loc_des?: string | null;
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

// Tipos para detalle de presupuesto
export interface CostoItem {
  pre_lin: number;
  pre_dtlin: number;
  Pre_DtTip: number;
  tipo_nombre: string;
  Pre_DtCant: number;
  Pre_DtPre: number;
  Pre_DtDescrip: string;
}

export interface ItemPresupuesto {
  pre_lin: number;
  pre_des: string;
  pre_de1: string;
  pre_de2: string;
  pre_de3: string;
  pre_de4: string;
  pre_cpr: number;
  pre_pre: number;
  pre_dct: number;
  costos: CostoItem[];
}

export interface DetallePresupuesto {
  loc_cod: number;
  pre_nro: number;
  items: ItemPresupuesto[];
}

export interface PresupuestoHistorico {
  Loc_cod: number;
  pre_nro: number;
  pre_fec: string;
  pre_rut: number;
  cliente_nombre: string;
  sol_nro: number;
  pre_ref: string;
  Pre_Neto: number;
  pre_est: string;
  pre_vbgg: number;
  pre_vbggUsu: string;
  pre_vbggDt: string;
  tienepdf?: number;
}

// Tipos para Órdenes de Compra
export interface OrdenCompraIndicadores {
  total: number;
  pendientes: number;
  aprobadas: number;
}

export interface OrdenCompraDetalle {
  Loc_cod: number;
  ocp_nro: number;
  ocp_fec: string;
  ocp_fee: string;
  pro_rut: number;
  proveedor_nombre: string;
  ocp_pdt: string;
  ocp_net: number;
  ocp_iva: number;
  ocp_ila: number;
  monto_total: number;
  tienepdf?: number;
  loc_des?: string | null;
  ocp_A2_Usu?: string;
  ocp_A2_Dt?: string;
  ocp_A2_Hr?: string;
}

export interface OrdenCompraAprobar {
  Loc_cod: number;
  ocp_nro: number;
}

export interface OrdenCompraAprobadoResponse {
  message: string;
  ocp_nro: number;
  new_status: string;
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

// Tipos para tenant
export interface TenantTema {
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_surface: string;
  color_text: string;
  logo_url: string | null;
}

export interface TenantConfig {
  slug: string;
  nombre: string;
  dominio: string;
  tema: TenantTema;
}
