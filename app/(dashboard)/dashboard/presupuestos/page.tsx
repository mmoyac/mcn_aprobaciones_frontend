'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { presupuestosApi } from '@/lib/api/presupuestos';
import { authApi } from '@/lib/api/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type Tab = 'pendientes' | 'aprobados';

export default function PresupuestosPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'pendientes');
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<{
    Loc_cod: number;
    pre_nro: number;
  } | null>(null);
  
  const queryClient = useQueryClient();
  const usuario = authApi.getUser();

  // Efecto para sincronizar el tab con la URL
  useEffect(() => {
    if (tabParam && (tabParam === 'pendientes' || tabParam === 'aprobados')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Query para presupuestos pendientes
  const { data: pendientes, isLoading: isLoadingPendientes } = useQuery({
    queryKey: ['presupuestos', 'pendientes'],
    queryFn: () => presupuestosApi.getPendientes(),
    enabled: activeTab === 'pendientes',
  });

  // Query para presupuestos aprobados
  const { data: aprobados, isLoading: isLoadingAprobados } = useQuery({
    queryKey: ['presupuestos', 'aprobados', usuario?.usuario],
    queryFn: () => {
      if (!usuario?.usuario) return Promise.resolve([]);
      
      // Obtener fecha actual para mostrar aprobaciones del día del usuario autenticado
      const hoy = new Date().toISOString().split('T')[0];
      return presupuestosApi.getAprobados(usuario.usuario.toLowerCase(), hoy, hoy);
    },
    enabled: activeTab === 'aprobados' && !!usuario?.usuario,
  });

  // Mutation para aprobar presupuesto
  const aprobarMutation = useMutation({
    mutationFn: (data: { Loc_cod: number; pre_nro: number }) =>
      presupuestosApi.aprobar(data),
    onSuccess: () => {
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores'] });
      setSelectedPresupuesto(null);
    },
  });

  const handleAprobar = (Loc_cod: number, pre_nro: number) => {
    setSelectedPresupuesto({ Loc_cod, pre_nro });
  };

  const confirmAprobar = () => {
    if (selectedPresupuesto) {
      aprobarMutation.mutate(selectedPresupuesto);
    }
  };

  const isLoading = activeTab === 'pendientes' ? isLoadingPendientes : isLoadingAprobados;
  const presupuestos = activeTab === 'pendientes' ? pendientes : aprobados;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Presupuestos</h1>
        <p className="text-slate-400 mt-2">
          Gestión de aprobaciones de presupuestos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'pendientes'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setActiveTab('aprobados')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'aprobados'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Aprobados
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      )}

      {/* Tabla de presupuestos */}
      {!isLoading && presupuestos && presupuestos.length > 0 && (
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    N° Presupuesto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Fecha Emisión
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                    Precio Neto
                  </th>
                  {activeTab === 'pendientes' && (
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                      Acción
                    </th>
                  )}
                  {activeTab === 'aprobados' && (
                    <>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Aprobado Por
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Fecha Aprobación
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {presupuestos.map((presupuesto) => (
                  <tr
                    key={`${presupuesto.Loc_cod}-${presupuesto.pre_nro}`}
                    className="hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {presupuesto.pre_nro}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {formatDate(presupuesto.pre_fec)}
                    </td>
                    <td className="px-6 py-4 text-right text-white font-semibold">
                      {formatCurrency(presupuesto.Pre_Neto)}
                    </td>
                    {activeTab === 'pendientes' && (
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            handleAprobar(presupuesto.Loc_cod, presupuesto.pre_nro)
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprobar
                        </button>
                      </td>
                    )}
                    {activeTab === 'aprobados' && (
                      <>
                        <td className="px-6 py-4 text-slate-300">
                          {presupuesto.pre_vbggUsu || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {presupuesto.pre_vbggDt
                            ? formatDate(presupuesto.pre_vbggDt)
                            : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!presupuestos || presupuestos.length === 0) && (
        <div className="text-center py-12 bg-slate-800 rounded-lg">
          <p className="text-slate-400 text-lg">
            No hay presupuestos {activeTab === 'pendientes' ? 'pendientes' : 'aprobados'}
          </p>
        </div>
      )}

      {/* Modal de confirmación */}
      {selectedPresupuesto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Confirmar Aprobación
            </h3>
            <p className="text-slate-300 mb-6">
              ¿Está seguro que desea aprobar el presupuesto N°{' '}
              <span className="font-bold text-teal-400">
                {selectedPresupuesto.pre_nro}
              </span>
              ?
            </p>
            {aprobarMutation.isError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">
                  Error al aprobar presupuesto. Intente nuevamente.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPresupuesto(null)}
                disabled={aprobarMutation.isPending}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAprobar}
                disabled={aprobarMutation.isPending}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aprobarMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Aprobar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
