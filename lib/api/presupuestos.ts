import axios from 'axios';
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

  desaprobar: async (presupuesto: PresupuestoAprobar): Promise<PresupuestoAprobadoResponse> => {
    const { data } = await apiClient.post<PresupuestoAprobadoResponse>(
      '/presupuestos/desaprobar',
      presupuesto
    );
    return data;
  },

  getPDF: async (numeroPresupuesto: number): Promise<Blob> => {
    try {
      // Intentar primero con proxy interno de Next.js para evitar problemas de CORS
      console.log('Fetching PDF via Next.js proxy for presupuesto:', numeroPresupuesto);
      
      const proxyResponse = await fetch(`/api/pdf?tipo=1&numero=${numeroPresupuesto}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      console.log('Proxy response status:', proxyResponse.status);
      
      if (proxyResponse.ok) {
        const blob = await proxyResponse.blob();
        console.log('PDF loaded successfully via proxy, size:', blob.size);
        return blob;
      } else {
        throw new Error(`Proxy error: ${proxyResponse.status}`);
      }
      
    } catch (proxyError: any) {
      console.warn('Proxy failed, trying direct connection:', proxyError.message);
      
      // Fallback: conexión directa al backend
      try {
        const directUrl = 'http://localhost:8000/api/v1/documentos-pdf/get';
        console.log('Trying direct connection to:', directUrl);
        
        const response = await axios.get(directUrl, {
          params: { tipo: 1, numero: numeroPresupuesto },
          headers: {
            'x-api-key': 'supersecreta123',
            'Accept': 'application/pdf',
          },
          responseType: 'blob',
          timeout: 15000,
          withCredentials: false,
        });
        
        console.log('Direct response status:', response.status);
        console.log('PDF size:', response.data.size);
        
        return response.data;
        
      } catch (error: any) {
        console.error('Both proxy and direct connection failed:', error);
        
        if (error.response) {
          throw new Error(`Error del servidor: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
        } else {
          throw new Error(`Error de configuración: ${error.message}`);
        }
      }
    }
  },
};
