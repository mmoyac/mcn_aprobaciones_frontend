import { apiClient } from './client';
import type { TenantConfig } from '../types';

export const tenantApi = {
  async getConfig(): Promise<TenantConfig> {
    const response = await apiClient.get<TenantConfig>('/tenant/config');
    return response.data;
  },
};
