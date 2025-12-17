import { apiClient } from './client';
import {
    OrdenCompraIndicadores,
    OrdenCompraDetalle,
    OrdenCompraAprobar,
    OrdenCompraAprobadoResponse
} from '@/lib/types';

export const ordenesApi = {
    getIndicadores: async (): Promise<OrdenCompraIndicadores> => {
        const { data } = await apiClient.get<OrdenCompraIndicadores>('/ordenes-compra/indicadores');
        return data;
    },

    getPendientes: async (skip = 0, limit = 100): Promise<OrdenCompraDetalle[]> => {
        const { data } = await apiClient.get<OrdenCompraDetalle[]>('/ordenes-compra/pendientes', {
            params: { skip, limit }
        });
        return data;
    },

    getAprobadas: async (
        usuario?: string, 
        fechaDesde?: string, 
        fechaHasta?: string,
        skip = 0,
        limit = 100
    ): Promise<OrdenCompraDetalle[]> => {
        const params: any = { skip, limit };
        if (usuario) params.usuario = usuario;
        if (fechaDesde) params.fecha_desde = fechaDesde;
        if (fechaHasta) params.fecha_hasta = fechaHasta;

        const { data } = await apiClient.get<OrdenCompraDetalle[]>('/ordenes-compra/aprobadas', {
            params
        });
        return data;
    },

    aprobar: async (payload: OrdenCompraAprobar): Promise<OrdenCompraAprobadoResponse> => {
        const { data } = await apiClient.post<OrdenCompraAprobadoResponse>('/ordenes-compra/aprobar', payload);
        return data;
    },

    desaprobar: async (payload: OrdenCompraAprobar): Promise<OrdenCompraAprobadoResponse> => {
        const { data } = await apiClient.post<OrdenCompraAprobadoResponse>('/ordenes-compra/desaprobar', payload);
        return data;
    },
};
