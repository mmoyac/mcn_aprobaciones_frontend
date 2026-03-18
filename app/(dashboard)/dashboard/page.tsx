'use client';

import { useQuery } from '@tanstack/react-query';
import { presupuestosApi } from '@/lib/api/presupuestos';
import { ordenesApi } from '@/lib/api/ordenes';
import { authApi } from '@/lib/api/auth';
import { FileText, CheckCircle, Clock, ShoppingCart, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import DbHealthAlert from '@/components/dashboard/DbHealthAlert';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ usuario: string; nombre: string } | null>(null);

  useEffect(() => {
    setUser(authApi.getUser());
  }, []);

  // --- PRESUPUESTOS ---
  const { data: indicadoresPresupuestos, isLoading: isLoadingIndPres } = useQuery({
    queryKey: ['indicadores'],
    queryFn: presupuestosApi.getIndicadores,
  });

  const { data: presAprobadosHoy, isLoading: isLoadingPresAprob } = useQuery({
    queryKey: ['presupuestos', 'aprobados', 'hoy', user?.usuario],
    queryFn: () => {
      if (!user?.usuario) return Promise.resolve([]);
      const d = new Date(); const hoy = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return presupuestosApi.getAprobados(user.usuario.toLowerCase(), hoy, hoy);
    },
    enabled: !!user?.usuario,
  });

  // --- ORDENES DE COMPRA ---
  const { data: indicadoresOrdenes, isLoading: isLoadingIndOrd } = useQuery({
    queryKey: ['indicadores-ordenes'],
    queryFn: ordenesApi.getIndicadores,
  });

  const { data: ordAprobadasHoy, isLoading: isLoadingOrdAprob } = useQuery({
    queryKey: ['ordenes', 'aprobados', 'hoy', user?.usuario],
    queryFn: () => {
      if (!user?.usuario) return Promise.resolve([]);
      const d = new Date(); const hoy = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return ordenesApi.getAprobadas(user.usuario.toLowerCase(), hoy, hoy);
    },
    enabled: !!user?.usuario,
  });


  const isLoading = isLoadingIndPres || isLoadingPresAprob || isLoadingIndOrd || isLoadingOrdAprob;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--tenant-primary)' }}></div>
      </div>
    );
  }

  const totalPresAprobadosHoy = presAprobadosHoy?.length || 0;
  const totalOrdAprobadasHoy = ordAprobadasHoy?.length || 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Tablero</h2>
        <p className="text-slate-400">Vista general del sistema de aprobaciones</p>
      </div>

      <DbHealthAlert />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* SECCION PRESUPUESTOS */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: 'var(--tenant-primary)' }} /> Presupuestos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pendientes */}
            <div
              className="rounded-lg p-6 border border-slate-700 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--tenant-surface)' }}
              onClick={() => router.push('/dashboard/presupuestos?tab=pendientes')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">
                  Ver Pendientes
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Pendientes</h3>
              <p className="text-3xl font-bold text-amber-400">{indicadoresPresupuestos?.pendientes || 0}</p>
            </div>

            {/* Aprobados */}
            <div
              className="rounded-lg p-6 border border-slate-700 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--tenant-surface)' }}
              onClick={() => router.push('/dashboard/presupuestos?tab=aprobados')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Aprobados Hoy</h3>
              <p className="text-3xl font-bold text-green-400">{totalPresAprobadosHoy}</p>
            </div>
          </div>
        </div>

        {/* SECCION ORDENES DE COMPRA */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" style={{ color: 'var(--tenant-secondary)' }} /> Órdenes de Compra
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pendientes */}
            <div
              className="rounded-lg p-6 border border-slate-700 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--tenant-surface)' }}
              onClick={() => router.push('/dashboard/ordenes-compra?tab=pendientes')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                  Ver Pendientes
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Pendientes</h3>
              <p className="text-3xl font-bold text-purple-400">{indicadoresOrdenes?.pendientes || 0}</p>
            </div>

            {/* Aprobados */}
            <div
              className="rounded-lg p-6 border border-slate-700 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--tenant-surface)' }}
              onClick={() => router.push('/dashboard/ordenes-compra?tab=aprobados')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-teal-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Aprobadas Hoy</h3>
              <p className="text-3xl font-bold text-teal-400">{totalOrdAprobadasHoy}</p>
            </div>
          </div>
        </div>

      </div>

      {/* SECCION HISTORICO */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-violet-400" /> Búsqueda
        </h3>
        <div
          className="rounded-lg p-6 border border-slate-700 cursor-pointer transition-colors max-w-sm"
          style={{ backgroundColor: 'var(--tenant-surface)' }}
          onClick={() => router.push('/dashboard/historico')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-violet-500/10 rounded-lg">
              <Search className="w-6 h-6 text-violet-400" />
            </div>
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full">
              Buscar
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Historial de Presupuestos</h3>
          <p className="text-slate-300 text-sm">Buscar por cliente o referencia</p>
        </div>
      </div>

      {/* Info adicional */}
      <div className="border border-slate-700 rounded-lg p-6" style={{ backgroundColor: 'var(--tenant-surface)' }}>
        <h3 className="text-lg font-semibold text-white mb-2">Bienvenido al Sistema</h3>
        <p className="text-slate-400 mb-4 max-w-3xl">
          Seleccione una categoría del menú lateral o haga clic en las tarjetas superiores para gestionar las aprobaciones pendientes.
        </p>
      </div>
    </div>
  );
}
