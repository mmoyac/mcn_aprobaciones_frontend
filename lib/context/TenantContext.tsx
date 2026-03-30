'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../api/tenant';
import type { TenantConfig } from '../types';

interface TenantContextValue {
  tenant: TenantConfig | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  isLoading: true,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  // Usar el hostname como parte de la queryKey para que cada tenant tenga su propio caché
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', 'config', hostname],
    queryFn: tenantApi.getConfig,
    staleTime: 5 * 60 * 1000, // 5 minutos — permite refetch si cambia la config
    retry: false,
  });

  // Aplicar CSS custom properties cuando se carga el tema
  useEffect(() => {
    if (!tenant?.tema) return;
    const { color_primary, color_secondary, color_background, color_surface, color_text } = tenant.tema;
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', color_primary);
    root.style.setProperty('--tenant-secondary', color_secondary);
    root.style.setProperty('--tenant-background', color_background);
    root.style.setProperty('--tenant-surface', color_surface);
    root.style.setProperty('--tenant-text', color_text);

    // Actualizar el title con el nombre del tenant
    document.title = `${tenant.nombre} | Aprobaciones`;

    // Actualizar theme-color meta tag
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', color_primary);

    // Actualizar favicon si el tenant tiene logo_url, sino generar uno con color del tenant
    // Siempre usamos un único elemento propio (id='tenant-favicon') para no tocar
    // los <link rel="icon"> que Next.js maneja en su árbol de fibras de React.
    // Borrar nodos del DOM que React rastrea provoca el error removeChild al desmontar.
    const FAVICON_ID = 'tenant-favicon';
    let faviconLink = document.getElementById(FAVICON_ID) as HTMLLinkElement | null;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.id = FAVICON_ID;
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }

    if (tenant.logo_url) {
      faviconLink.type = 'image/x-icon';
      faviconLink.href = tenant.logo_url;
    } else {
      // Generar favicon SVG dinámico con la inicial del tenant y el color primario
      const inicial = tenant.nombre.charAt(0).toUpperCase();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill="${color_primary}"/>
        <text x="16" y="22" font-family="Arial,sans-serif" font-size="18" font-weight="bold"
          text-anchor="middle" fill="white">${inicial}</text>
      </svg>`;
      faviconLink.type = 'image/svg+xml';
      faviconLink.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
  }, [tenant]);

  return (
    <TenantContext.Provider value={{ tenant: tenant ?? null, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext);
}
