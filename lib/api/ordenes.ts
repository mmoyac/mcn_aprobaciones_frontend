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

    getPendientes: async (): Promise<OrdenCompraDetalle[]> => {
        const { data } = await apiClient.get<OrdenCompraDetalle[]>('/ordenes-compra/pendientes');
        return data;
    },

    getAprobados: async (usuario: string, fechaDesde: string, fechaHasta: string): Promise<OrdenCompraDetalle[]> => {
        const { data } = await apiClient.get<OrdenCompraDetalle[]>('/ordenes-compra/aprobados', {
            params: {
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta
            },
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
