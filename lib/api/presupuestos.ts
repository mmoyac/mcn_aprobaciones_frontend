import { apiClient } from './client';
import {
  PresupuestoIndicadores,
  PresupuestoDetalle,
  PresupuestoAprobar,
  PresupuestoAprobadoResponse,
} from '../types';

export const presupuestosApi = {
  getIndicadores: async (): Promise<PresupuestoIndicadores> => {
    const { data } = await apiClient.get<PresupuestoIndicadores>('/presupuestos/indicadores');
    return data;
  },

  getPendientes: async (skip = 0, limit = 100): Promise<PresupuestoDetalle[]> => {
    const { data } = await apiClient.get<PresupuestoDetalle[]>('/presupuestos/pendientes', {
      params: { skip, limit },
    });
    return data;
  },

  getAprobados: async (
    usuario?: string,
    fecha_desde?: string,
    fecha_hasta?: string,
    skip = 0,
    limit = 100
  ): Promise<PresupuestoDetalle[]> => {
    const params: any = { skip, limit };
    if (usuario) params.usuario = usuario;
    if (fecha_desde) params.fecha_desde = fecha_desde;
    if (fecha_hasta) params.fecha_hasta = fecha_hasta;
    
    const { data } = await apiClient.get<PresupuestoDetalle[]>('/presupuestos/aprobados', {
      params,
    });
    return data;
  },

  aprobar: async (presupuesto: PresupuestoAprobar): Promise<PresupuestoAprobadoResponse> => {
    const { data } = await apiClient.post<PresupuestoAprobadoResponse>(
      '/presupuestos/aprobar',
      presupuesto
    );
    return data;
  },
};
