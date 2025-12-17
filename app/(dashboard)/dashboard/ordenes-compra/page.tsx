'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ordenesApi } from '@/lib/api/ordenes';
import { authApi } from '@/lib/api/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, FileText, FileX, Eye, Download, X } from 'lucide-react';

type Tab = 'pendientes' | 'aprobadas';

export default function OrdenesCompraPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'pendientes');
  const [selectedOrden, setSelectedOrden] = useState<{
    Loc_cod: number;
    ocp_nro: number;
  } | null>(null);

  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    numeroOrden: number | null;
    pdfUrl: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    numeroOrden: null,
    pdfUrl: null,
    isLoading: false,
  });

  const queryClient = useQueryClient();
  const usuario = authApi.getUser();

  // Prevenir scroll del body cuando hay modal abierto
  useEffect(() => {
    if (selectedOrden || pdfModal.isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Compensar por scrollbar
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [selectedOrden, pdfModal.isOpen]);

  // Función para abrir PDF
  const handleViewPDF = async (numeroOrden: number) => {
    setPdfModal(prev => ({
      ...prev,
      isOpen: true,
      numeroOrden,
      isLoading: true,
      pdfUrl: null,
    }));

    try {
      // Usar el endpoint proxy para órdenes de compra
      const response = await fetch(`/api/ordenes-pdf/get?numero=${numeroOrden}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener PDF');
      }
      
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setPdfModal(prev => ({
        ...prev,
        pdfUrl,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      alert(`Error al cargar PDF: ${error.message}`);
      setPdfModal(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  // Función para descargar PDF
  const handleDownloadPDF = async (numeroOrden: number) => {
    try {
      const response = await fetch(`/api/ordenes-pdf/get?numero=${numeroOrden}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener PDF');
      }
      
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orden-compra-${numeroOrden}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      alert(`Error al descargar PDF: ${error.message}`);
    }
  };

  // Efecto para sincronizar el tab con la URL
  useEffect(() => {
    if (tabParam && (tabParam === 'pendientes' || tabParam === 'aprobadas')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Query para órdenes pendientes
  const { data: pendientes, isLoading: isLoadingPendientes } = useQuery({
    queryKey: ['ordenes', 'pendientes'],
    queryFn: () => ordenesApi.getPendientes(),
    enabled: activeTab === 'pendientes',
  });

  // Query para órdenes aprobadas (solo las de hoy por defecto)
  const { data: aprobadas, isLoading: isLoadingAprobadas } = useQuery({
    queryKey: ['ordenes', 'aprobadas'],
    queryFn: () => ordenesApi.getAprobadas(), // Sin parámetros = solo las de hoy
    enabled: activeTab === 'aprobadas',
  });

  // Función para cerrar modal PDF
  const closePdfModal = () => {
    if (pdfModal.pdfUrl) {
      URL.revokeObjectURL(pdfModal.pdfUrl);
    }
    setPdfModal({
      isOpen: false,
      numeroOrden: null,
      pdfUrl: null,
      isLoading: false,
    });
  };

  // Cleanup PDF URLs cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (pdfModal.pdfUrl) {
        URL.revokeObjectURL(pdfModal.pdfUrl);
      }
    };
  }, [pdfModal.pdfUrl]);

  // Mutation para aprobar orden
  const aprobarMutation = useMutation({
    mutationFn: (data: { Loc_cod: number; ocp_nro: number }) =>
      ordenesApi.aprobar(data),
    onSuccess: () => {
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores'] });
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
      queryClient.invalidateQueries({ queryKey: ['indicadores'] });
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
  const isLoading = activeTab === 'pendientes' ? isLoadingPendientes : isLoadingAprobadas;
  const ordenes = activeTab === 'pendientes' ? pendientes : aprobadas;

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
          onClick={() => setActiveTab('aprobadas')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'aprobadas'
            ? 'text-teal-400 border-b-2 border-teal-400'
            : 'text-slate-400 hover:text-slate-300'
            }`}
        >
          Aprobadas Hoy
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      )}

      {/* Tabla de órdenes (Desktop) y Cards (Mobile) */}
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
                    <p className="text-xs text-slate-400 mt-1">{orden.pro_rut}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{formatDate(orden.ocp_fec)}</p>
                    <p className="text-teal-400 font-bold text-lg mt-1">
                      {formatCurrency(orden.monto_total)}
                    </p>
                  </div>
                </div>

                {/* Estado y PDF */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {(() => {
                      const est = orden.ocp_pdt?.trim().toUpperCase();
                      switch (est) {
                        case 'I': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Pendiente</span>;
                        case 'T': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400">Recepcionada</span>;
                        case 'N': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">Nula</span>;
                        default: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">{est || 'Sin Estado'}</span>;
                      }
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    {orden.tienepdf === 1 ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewPDF(orden.ocp_nro)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span className="hidden sm:inline">Ver</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(orden.ocp_nro)}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-xs"
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <FileX className="w-3 h-3" />
                        <span className="hidden sm:inline">Sin PDF</span>
                      </div>
                    )}
                  </div>
                </div>

                {activeTab === 'aprobadas' && (
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-700/50 bg-slate-700/10 -mx-2 px-2 pb-1 rounded-b-lg">
                    <div>
                      <span className="block text-xs text-teal-500/80 mb-0.5 font-medium">Aprobado por</span>
                      <span className="text-sm font-semibold text-teal-100">{orden.ocp_A2_Usu}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-teal-500/80 mb-0.5 font-medium">Fecha Aprobación</span>
                      <span className="text-sm font-semibold text-teal-100">
                        {orden.ocp_A2_Dt ? formatDate(orden.ocp_A2_Dt) : '-'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                {activeTab === 'pendientes' && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
                    <button
                      onClick={() => handleAction(orden.Loc_cod, orden.ocp_nro, 'aprobar')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                  </div>
                )}

                {activeTab === 'aprobadas' && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
                    <button
                      onClick={() => handleAction(orden.Loc_cod, orden.ocp_nro, 'desaprobar')}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Desaprobar
                    </button>
                  </div>
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      PDF
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      Monto Total
                    </th>
                    {activeTab === 'pendientes' && (
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                        Acción
                      </th>
                    )}
                    {activeTab === 'aprobadas' && (
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
                        {(() => {
                          const est = orden.ocp_pdt?.trim().toUpperCase();
                          switch (est) {
                            case 'I': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Pendiente</span>;
                            case 'T': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400">Recepcionada</span>;
                            case 'N': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">Nula</span>;
                            default: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">{est || 'Sin Estado'}</span>;
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {orden.tienepdf === 1 ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewPDF(orden.ocp_nro)}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs"
                              title="Ver PDF"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(orden.ocp_nro)}
                              className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-xs"
                              title="Descargar PDF"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-500">
                            <FileX className="w-4 h-4" />
                            <span className="text-xs">Sin PDF</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-semibold whitespace-nowrap">
                        {formatCurrency(orden.monto_total)}
                      </td>
                      {activeTab === 'pendientes' && (
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleAction(orden.Loc_cod, orden.ocp_nro, 'aprobar')}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors font-medium text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprobar
                          </button>
                        </td>
                      )}
                      {activeTab === 'aprobadas' && (
                        <>
                          <td className="px-6 py-4 text-slate-300">
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{orden.ocp_A2_Usu}</span>
                              <span className="text-xs text-slate-500">
                                {orden.ocp_A2_Hr ? `${orden.ocp_A2_Hr}` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                            {orden.ocp_A2_Dt ? formatDate(orden.ocp_A2_Dt) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleAction(orden.Loc_cod, orden.ocp_nro, 'desaprobar')}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium text-sm"
                            >
                              <XCircle className="w-4 h-4" />
                              Desaprobar
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

      {/* Mensaje de sin datos */}
      {!isLoading && (!ordenes || ordenes.length === 0) && (
        <div className="text-center py-12">
          <div className="text-slate-400 text-lg mb-2">
            {activeTab === 'pendientes' 
              ? 'No hay órdenes pendientes de aprobación' 
              : 'No hay órdenes aprobadas hoy'
            }
          </div>
          <p className="text-slate-500 text-sm">
            {activeTab === 'pendientes'
              ? 'Todas las órdenes han sido procesadas'
              : 'No se han aprobado órdenes el día de hoy'
            }
          </p>
        </div>
      )}

      {/* Modal de Confirmación */}
      {selectedOrden && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {modalAction === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Desaprobación'}
            </h3>
            
            <p className="text-slate-300 mb-6">
              {modalAction === 'aprobar'
                ? `¿Estás seguro de que deseas aprobar la orden N° ${selectedOrden.ocp_nro}?`
                : `¿Estás seguro de que deseas deshacer la aprobación de la orden N° ${selectedOrden.ocp_nro}?`
              }
            </p>

            {isError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-400 text-sm">
                Error al procesar la solicitud. Inténtalo de nuevo.
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedOrden(null)}
                disabled={isPending}
                className="px-4 py-2 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                disabled={isPending}
                className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 ${
                  modalAction === 'aprobar'
                    ? 'bg-teal-600 hover:bg-teal-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {modalAction === 'aprobar' ? 'Aprobar' : 'Desaprobar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {pdfModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">
                Orden de Compra N° {pdfModal.numeroOrden}
              </h3>
              <div className="flex items-center gap-2">
                {pdfModal.pdfUrl && (
                  <button
                    onClick={() => pdfModal.numeroOrden && handleDownloadPDF(pdfModal.numeroOrden)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Descargar</span>
                  </button>
                )}
                <button
                  onClick={closePdfModal}
                  className="flex items-center justify-center w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="flex-1 p-4 overflow-hidden">
              {pdfModal.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-3 text-white">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Cargando PDF...</span>
                  </div>
                </div>
              ) : pdfModal.pdfUrl ? (
                <iframe
                  src={pdfModal.pdfUrl}
                  className="w-full h-full rounded border border-slate-600"
                  title={`Orden de Compra ${pdfModal.numeroOrden}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-red-400">
                    <FileX className="w-12 h-12 mx-auto mb-3" />
                    <p>Error al cargar el PDF</p>
                    <p className="text-sm text-slate-400 mt-1">
                      No se pudo mostrar el documento
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
