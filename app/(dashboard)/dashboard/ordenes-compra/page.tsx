'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ordenesApi } from '@/lib/api/ordenes';
import { authApi } from '@/lib/api/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type Tab = 'pendientes' | 'aprobados';

export default function OrdenesCompraPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as Tab | null;
    const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'pendientes');
    const [selectedOrden, setSelectedOrden] = useState<{
        Loc_cod: number;
        ocp_nro: number;
    } | null>(null);

    const queryClient = useQueryClient();
    const usuario = authApi.getUser();

    // Efecto para sincronizar el tab con la URL
    useEffect(() => {
        if (tabParam && (tabParam === 'pendientes' || tabParam === 'aprobados')) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    // Query para ordenes pendientes
    const { data: pendientes, isLoading: isLoadingPendientes } = useQuery({
        queryKey: ['ordenes', 'pendientes'],
        queryFn: () => ordenesApi.getPendientes(),
        enabled: activeTab === 'pendientes',
    });

    // Query para ordenes aprobados
    const { data: aprobados, isLoading: isLoadingAprobados } = useQuery({
        queryKey: ['ordenes', 'aprobados', usuario?.usuario],
        queryFn: () => {
            if (!usuario?.usuario) return Promise.resolve([]);

            // Obtener fecha actual para mostrar aprobaciones del día del usuario autenticado
            const hoy = new Date().toISOString().split('T')[0];
            return ordenesApi.getAprobados(usuario.usuario.toLowerCase(), hoy, hoy);
        },
        enabled: activeTab === 'aprobados' && !!usuario?.usuario,
    });

    // Mutation para aprobar orden
    const aprobarMutation = useMutation({
        mutationFn: (data: { Loc_cod: number; ocp_nro: number }) =>
            ordenesApi.aprobar(data),
        onSuccess: () => {
            // Invalidar queries para refrescar datos
            queryClient.invalidateQueries({ queryKey: ['ordenes'] });
            queryClient.invalidateQueries({ queryKey: ['indicadores-ordenes'] });
            setSelectedOrden(null);
        },
    });

    // Mutation para desaprobar orden
    const desaprobarMutation = useMutation({
        mutationFn: (data: { Loc_cod: number; ocp_nro: number }) =>
            ordenesApi.desaprobar(data),
        onSuccess: () => {
            // Invalidar queries para refrescar datos
            queryClient.invalidateQueries({ queryKey: ['ordenes'] });
            queryClient.invalidateQueries({ queryKey: ['indicadores-ordenes'] });
            setSelectedOrden(null);
        },
    });

    const [modalAction, setModalAction] = useState<'aprobar' | 'desaprobar'>('aprobar');

    const handleAction = (Loc_cod: number, ocp_nro: number, action: 'aprobar' | 'desaprobar') => {
        setModalAction(action);
        setSelectedOrden({ Loc_cod, ocp_nro });
    };

    const confirmAction = () => {
        if (selectedOrden) {
            if (modalAction === 'aprobar') {
                aprobarMutation.mutate(selectedOrden);
            } else {
                desaprobarMutation.mutate(selectedOrden);
            }
        }
    };

    const isPending = aprobarMutation.isPending || desaprobarMutation.isPending;
    const isError = aprobarMutation.isError || desaprobarMutation.isError;
    const isLoading = activeTab === 'pendientes' ? isLoadingPendientes : isLoadingAprobados;
    const ordenes = activeTab === 'pendientes' ? pendientes : aprobados;

    const getEstadoLabel = (estado: string) => {
        const est = estado?.trim().toUpperCase();
        switch (est) {
            case 'I': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Pendiente</span>;
            case 'T': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400">Recepcionada</span>;
            case 'N': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">Nula</span>;
            default: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">{est || 'Sin Estado'}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Órdenes de Compra</h1>
                <p className="text-slate-400 mt-2">
                    Gestión de aprobaciones de órdenes de compra
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('pendientes')}
                    className={`px-6 py-3 font-medium transition-colors ${activeTab === 'pendientes'
                        ? 'text-teal-400 border-b-2 border-teal-400'
                        : 'text-slate-400 hover:text-slate-300'
                        }`}
                >
                    Pendientes
                </button>
                <button
                    onClick={() => setActiveTab('aprobados')}
                    className={`px-6 py-3 font-medium transition-colors ${activeTab === 'aprobados'
                        ? 'text-teal-400 border-b-2 border-teal-400'
                        : 'text-slate-400 hover:text-slate-300'
                        }`}
                >
                    Aprobadas
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
            )}

            {/* Tabla de Ordenes (Desktop) y Cards (Mobile) */}
            {!isLoading && ordenes && ordenes.length > 0 && (
                <>
                    {/* Vista Mobile: Cards */}
                    <div className="md:hidden space-y-4">
                        {ordenes.map((orden) => (
                            <div
                                key={`mobile-${orden.Loc_cod}-${orden.ocp_nro}`}
                                className="bg-slate-800 rounded-lg p-4 border border-slate-700 shadow-sm"
                            >
                                {/* Cabecera Card */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-xs text-slate-500 font-mono">#{orden.ocp_nro}</span>
                                        <h3 className="text-white font-medium text-lg leading-tight mt-1">
                                            {orden.proveedor_nombre}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">RUT: {orden.pro_rut}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{formatDate(orden.ocp_fec)}</p>
                                        <p className="text-teal-400 font-bold text-lg mt-1">
                                            {formatCurrency(orden.monto_total)}
                                        </p>
                                    </div>
                                </div>

                                {/* Detalles Card */}
                                <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-300 mb-4 border-t border-slate-700/50 pt-3">
                                    <div>
                                        <span className="block text-xs text-slate-500">Entrega Est.</span>
                                        {formatDate(orden.ocp_fee)}
                                    </div>
                                    <div>
                                        <span className="block text-xs text-slate-500">Estado</span>
                                        {getEstadoLabel(orden.ocp_pdt)}
                                    </div>

                                    {activeTab === 'aprobados' && (
                                        <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-slate-700/50 bg-slate-700/10 -mx-2 px-2 pb-1 rounded-b-lg">
                                            <div>
                                                <span className="block text-xs text-teal-500/80 mb-0.5 font-medium">Aprobado por</span>
                                                <span className="text-sm font-semibold text-teal-100">{orden.ocp_A1_Usu}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xs text-teal-500/80 mb-0.5 font-medium">Fecha Aprobación</span>
                                                <span className="text-sm font-semibold text-teal-100">
                                                    {orden.ocp_A1_Dt ? formatDate(orden.ocp_A1_Dt) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Acción Card */}
                                {activeTab === 'pendientes' ? (
                                    <button
                                        onClick={() =>
                                            handleAction(orden.Loc_cod, orden.ocp_nro, 'aprobar')
                                        }
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 active:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Aprobar Orden
                                    </button>
                                ) : (
                                    <button
                                        onClick={() =>
                                            handleAction(orden.Loc_cod, orden.ocp_nro, 'desaprobar')
                                        }
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 border border-slate-600 text-red-400 active:bg-slate-600 rounded-lg font-medium transition-colors"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Deshacer Aprobación
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Vista Desktop: Tabla */}
                    <div className="hidden md:block bg-slate-800 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                            N° Orden
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                            Proveedor
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                            Entrega Est.
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                                            Estado
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                                            Monto Total
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
                                                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                                                    Acción
                                                </th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {ordenes.map((orden) => (
                                        <tr
                                            key={`${orden.Loc_cod}-${orden.ocp_nro}`}
                                            className="hover:bg-slate-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-white font-medium">
                                                {orden.ocp_nro}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                                                {formatDate(orden.ocp_fec)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{orden.proveedor_nombre}</span>
                                                    <span className="text-xs text-slate-500">{orden.pro_rut}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                                                {formatDate(orden.ocp_fee)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {getEstadoLabel(orden.ocp_pdt)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-white font-semibold whitespace-nowrap">
                                                {formatCurrency(orden.monto_total)}
                                            </td>
                                            {activeTab === 'pendientes' && (
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() =>
                                                            handleAction(orden.Loc_cod, orden.ocp_nro, 'aprobar')
                                                        }
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors font-medium text-sm"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Aprobar
                                                    </button>
                                                </td>
                                            )}
                                            {activeTab === 'aprobados' && (
                                                <>
                                                    <td className="px-6 py-4 text-slate-300">
                                                        {orden.ocp_A1_Usu || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                                                        {orden.ocp_A1_Dt
                                                            ? formatDate(orden.ocp_A1_Dt)
                                                            : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() =>
                                                                handleAction(orden.Loc_cod, orden.ocp_nro, 'desaprobar')
                                                            }
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-600/30 rounded-md transition-colors font-medium text-sm"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Deshacer
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Empty state */}
            {!isLoading && (!ordenes || ordenes.length === 0) && (
                <div className="text-center py-12 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-lg">
                        No hay órdenes {activeTab === 'pendientes' ? 'pendientes' : 'aprobadas'}
                    </p>
                </div>
            )}

            {/* Modal de confirmación */}
            {selectedOrden && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {modalAction === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Desaprobación'}
                        </h3>
                        <p className="text-slate-300 mb-6">
                            ¿Está seguro que desea {modalAction === 'aprobar' ? 'aprobar' : 'desaprobar'} la orden de compra N°{' '}
                            <span className="font-bold text-teal-400">
                                {selectedOrden.ocp_nro}
                            </span>
                            ?
                        </p>
                        {isError && (
                            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                                <p className="text-red-300 text-sm">
                                    Error al procesar la solicitud. Intente nuevamente.
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedOrden(null)}
                                disabled={isPending}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={isPending}
                                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${modalAction === 'aprobar'
                                    ? 'bg-teal-600 hover:bg-teal-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        {modalAction === 'aprobar' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {modalAction === 'aprobar' ? 'Aprobar' : 'Desaprobar'}
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
