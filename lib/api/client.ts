import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Construye la URL base de la API según el entorno:
 * - Dev (*.localhost): http://<hostname>:<NEXT_PUBLIC_API_PORT>/api/v1
 * - Prod: usa NEXT_PUBLIC_API_URL
 */
function buildApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050/api/v1';
  }
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    const port = process.env.NEXT_PUBLIC_API_PORT || '8050';
    return `http://${hostname}:${port}/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || `${protocol}//${hostname}/api/v1`;
}

export const apiClient = axios.create({
  baseURL: buildApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token y header de tenant automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Header de tenant para que el backend resuelva la BD correcta
    // (necesario en prod donde el API está en un dominio distinto al frontend)
    if (typeof window !== 'undefined') {
      config.headers['X-Tenant-Domain'] = window.location.hostname;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expirado, inválido o sin permisos
      Cookies.remove('access_token');
      Cookies.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
