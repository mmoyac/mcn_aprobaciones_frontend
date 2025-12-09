import { apiClient } from './client';
import { LoginRequest, LoginResponse } from '../types';
import Cookies from 'js-cookie';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    // Guardar token y datos de usuario
    Cookies.set('access_token', data.access_token, { expires: 1/48 }); // 30 minutos
    Cookies.set('user', JSON.stringify({ usuario: data.usuario, nombre: data.nombre }), { expires: 1/48 });
    
    return data;
  },

  logout: () => {
    Cookies.remove('access_token');
    Cookies.remove('user');
  },

  getUser: () => {
    const userStr = Cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!Cookies.get('access_token');
  },
};
