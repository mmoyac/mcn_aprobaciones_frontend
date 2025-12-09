'use client';

import { useQuery } from '@tanstack/react-query';
import { presupuestosApi } from '@/lib/api/presupuestos';
import { authApi } from '@/lib/api/auth';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ usuario: string; nombre: string } | null>(null);

  useEffect(() => {
    setUser(authApi.getUser());
  }, []);

  const { data: indicadores, isLoading: isLoadingIndicadores } = useQuery({
    queryKey: ['indicadores'],
    queryFn: presupuestosApi.getIndicadores,
  });

  // Query para contar aprobados del día del usuario actual
  const { data: aprobadosHoy, isLoading: isLoadingAprobados } = useQuery({
    queryKey: ['presupuestos', 'aprobados', 'hoy', user?.usuario],
    queryFn: () => {
      if (!user?.usuario) return Promise.resolve([]);
      const hoy = new Date().toISOString().split('T')[0];
      return presupuestosApi.getAprobados(user.usuario.toLowerCase(), hoy, hoy);
    },
    enabled: !!user?.usuario,
  });

  const isLoading = isLoadingIndicadores || isLoadingAprobados;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const totalAprobadosHoy = aprobadosHoy?.length || 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-slate-400">Vista general del sistema de aprobaciones</p>
      </div>

      {/* Cards de indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total presupuestos */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Total Presupuestos</h3>
          <p className="text-3xl font-bold text-white">
            {(indicadores?.pendientes || 0) + (indicadores?.aprobados || 0)}
          </p>
        </div>

        {/* Pendientes */}
        <div
          className="bg-slate-800 rounded-lg p-6 border border-slate-700 cursor-pointer hover:border-amber-500 transition-colors"
          onClick={() => router.push('/dashboard/presupuestos?tab=pendientes')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">
              Click para ver
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Pendientes</h3>
          <p className="text-3xl font-bold text-amber-400">{indicadores?.pendientes || 0}</p>
        </div>

        {/* Aprobados */}
        <div
          className="bg-slate-800 rounded-lg p-6 border border-slate-700 cursor-pointer hover:border-green-500 transition-colors"
          onClick={() => router.push('/dashboard/presupuestos?tab=aprobados')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
              Click para ver
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Aprobados Hoy</h3>
          <p className="text-3xl font-bold text-green-400">{totalAprobadosHoy}</p>
        </div>
      </div>

      {/* Info adicional */}
      <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Bienvenido al Sistema</h3>
        <p className="text-slate-300 mb-4">
          Haz clic en las tarjetas de Pendientes o Aprobados para ver el listado completo de
          presupuestos. Los aprobados muestran solo los del día de hoy.
        </p>
        <button
          onClick={() => router.push('/dashboard/presupuestos')}
          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-lg transition-all"
        >
          Ir a Presupuestos
        </button>
      </div>
    </div>
  );
}
