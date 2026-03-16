'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { presupuestosApi } from '@/lib/api/presupuestos';
import { authApi } from '@/lib/api/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, FileText, FileX, Eye, Download, X } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';

type Tab = 'pendientes' | 'aprobados';

export default function PresupuestosPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'pendientes');
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<{
    Loc_cod: number;
    pre_nro: number;
  } | null>(null);

  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    numeroPresupuesto: number | null;
    pdfUrl: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    numeroPresupuesto: null,
    pdfUrl: null,
    isLoading: false,
  });

  const queryClient = useQueryClient();
  const usuario = authApi.getUser();

  // Prevenir scroll del body cuando hay modal abierto
  useEffect(() => {
    if (selectedPresupuesto || pdfModal.isOpen) {
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
  }, [selectedPresupuesto, pdfModal.isOpen]);

  // Función para abrir PDF
  const handleViewPDF = async (numeroPresupuesto: number) => {
    setPdfModal(prev => ({
      ...prev,
      isOpen: true,
      numeroPresupuesto,
      isLoading: true,
      pdfUrl: null,
    }));

    try {
      const pdfBlob = await presupuestosApi.getPDF(numeroPresupuesto);
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
  const handleDownloadPDF = async (numeroPresupuesto: number) => {
    try {
      const pdfBlob = await presupuestosApi.getPDF(numeroPresupuesto);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presupuesto-${numeroPresupuesto}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      alert(`Error al descargar PDF: ${error.message}`);
    }
  };

  // Función para cerrar modal
  const closePdfModal = () => {
    if (pdfModal.pdfUrl) {
      URL.revokeObjectURL(pdfModal.pdfUrl);
    }
    setPdfModal({
      isOpen: false,
      numeroPresupuesto: null,
      pdfUrl: null,
      isLoading: false,
    });
  };

  // Efecto para sincronizar el tab con la URL
  useEffect(() => {
    if (tabParam && (tabParam === 'pendientes' || tabParam === 'aprobados')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Cleanup PDF URLs cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (pdfModal.pdfUrl) {
        URL.revokeObjectURL(pdfModal.pdfUrl);
      }
    };
  }, [pdfModal.pdfUrl]);

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

      // Mostrar solo las aprobaciones de HOY del usuario autenticado
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];
      
      return presupuestosApi.getAprobados(usuario.usuario.toLowerCase(), fechaHoy, fechaHoy);
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

  // Mutation para desaprobar presupuesto
  const desaprobarMutation = useMutation({
    mutationFn: (data: { Loc_cod: number; pre_nro: number }) =>
      presupuestosApi.desaprobar(data),
    onSuccess: () => {
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
      queryClient.invalidateQueries({ queryKey: ['indicadores'] });
      setSelectedPresupuesto(null);
    },
  });

  const [modalAction, setModalAction] = useState<'aprobar' | 'desaprobar'>('aprobar');

  const handleAction = (Loc_cod: number, pre_nro: number, action: 'aprobar' | 'desaprobar') => {
    setModalAction(action);
    setSelectedPresupuesto({ Loc_cod, pre_nro });
  };

  const confirmAction = () => {
    if (selectedPresupuesto) {
      if (modalAction === 'aprobar') {
        aprobarMutation.mutate(selectedPresupuesto);
      } else {
        desaprobarMutation.mutate(selectedPresupuesto);
      }
    }
  };

  const isPending = aprobarMutation.isPending || desaprobarMutation.isPending;
  const isError = aprobarMutation.isError || desaprobarMutation.isError;
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
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'pendientes'
            ? 'border-b-2'
            : 'text-slate-400 hover:text-slate-300'
            }`}
          style={activeTab === 'pendientes' ? { color: 'var(--tenant-primary)', borderColor: 'var(--tenant-primary)' } : {}}
        >
          Pendientes
        </button>
        <button
          onClick={() => setActiveTab('aprobados')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'aprobados'
            ? 'border-b-2'
            : 'text-slate-400 hover:text-slate-300'
            }`}
          style={activeTab === 'aprobados' ? { color: 'var(--tenant-primary)', borderColor: 'var(--tenant-primary)' } : {}}
        >
          Aprobados Hoy
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--tenant-primary)' }} />
        </div>
      )}

      {/* Tabla de presupuestos (Desktop) y Cards (Mobile) */}
      {!isLoading && presupuestos && presupuestos.length > 0 && (
        <>
          {/* Vista Mobile: Cards */}
          <div className="md:hidden space-y-4">
            {presupuestos.map((presupuesto) => (
              <div
                key={`mobile-${presupuesto.Loc_cod}-${presupuesto.pre_nro}`}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 shadow-sm"
              >
                {/* Cabecera Card */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs text-slate-500 font-mono">#{presupuesto.pre_nro}</span>
                    <h3 className="text-white font-medium text-lg leading-tight mt-1">
                      {presupuesto.cliente_nombre}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{presupuesto.pre_rut}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{formatDate(presupuesto.pre_fec)}</p>
                    <p className="text-teal-400 font-bold text-lg mt-1">
                      {formatCurrency(presupuesto.Pre_Neto)}
                    </p>
                  </div>
                </div>

                {/* Detalles Card */}
                <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-300 mb-4 border-t border-slate-700/50 pt-3">
                  <div>
                    <span className="block text-xs text-slate-500">Solicitud</span>
                    {presupuesto.sol_nro || '-'}
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Estado</span>
                    {(() => {
                      const est = presupuesto.pre_est?.trim().toUpperCase();
                      switch (est) {
                        case 'N': return <span className="text-gray-400">No Vigente</span>;
                        case 'P': return <span className="text-red-400">Perdido</span>;
                        case 'G': return <span className="text-teal-400">Ganado</span>;
                        default: return <span className="text-blue-400">Sin Asignación</span>;
                      }
                    })()}
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-slate-500">Referencia</span>
                    <p className="truncate">{presupuesto.pre_ref || '-'}</p>
                  </div>



                  {activeTab === 'aprobados' && (
                    <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-slate-700/50 bg-slate-700/10 -mx-2 px-2 pb-1 rounded-b-lg">
                      <div>
                        <span className="block text-xs text-teal-500/80 mb-0.5 font-medium">Aprobado por</span>
                        <span className="text-sm font-semibold text-teal-100">{presupuesto.pre_vbggUsu}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-teal-500/80 mb-0.5 font-medium">Fecha Aprobación</span>
                        <span className="text-sm font-semibold text-teal-100">
                          {presupuesto.pre_vbggDt ? formatDate(presupuesto.pre_vbggDt) : '-'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* PDF Buttons (para ambas pestañas) */}
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">PDF</span>
                    {presupuesto.tienepdf === 1 ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewPDF(presupuesto.pre_nro)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(presupuesto.pre_nro)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Descargar
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-red-400">
                        <FileX className="w-3 h-3" />
                        <span className="text-xs">No disponible</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acción Card */}
                {activeTab === 'pendientes' ? (
                  <button
                    onClick={() =>
                      handleAction(presupuesto.Loc_cod, presupuesto.pre_nro, 'aprobar')
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 active:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Aprobar Presupuesto
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleAction(presupuesto.Loc_cod, presupuesto.pre_nro, 'desaprobar')
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
                      N° Presupuesto
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Cliente (RUT)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Solicitud
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Referencia
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      Precio Neto
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                      PDF
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
                  {presupuestos.map((presupuesto) => (
                    <tr
                      key={`${presupuesto.Loc_cod}-${presupuesto.pre_nro}`}
                      className="hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        {presupuesto.pre_nro}
                      </td>
                      <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                        {formatDate(presupuesto.pre_fec)}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{presupuesto.cliente_nombre}</span>
                          <span className="text-xs text-slate-500">{presupuesto.pre_rut}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {presupuesto.sol_nro || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm max-w-[200px] truncate" title={presupuesto.pre_ref}>
                        {presupuesto.pre_ref || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {(() => {
                          const est = presupuesto.pre_est?.trim().toUpperCase();
                          switch (est) {
                            case 'N': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">No Vigente</span>;
                            case 'P': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Perdido</span>;
                            case 'G': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400">Ganado</span>;
                            default: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Sin Asignación</span>;
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-semibold whitespace-nowrap">
                        {formatCurrency(presupuesto.Pre_Neto)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {presupuesto.tienepdf === 1 ? (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleViewPDF(presupuesto.pre_nro)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer"
                              title="Ver PDF"
                            >
                              <Eye className="w-3 h-3" />
                              Ver
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(presupuesto.pre_nro)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors cursor-pointer"
                              title="Descargar PDF"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400" title="Sin PDF">
                            <FileX className="w-3 h-3" />
                            Sin PDF
                          </div>
                        )}
                      </td>
                      {activeTab === 'pendientes' && (
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              handleAction(presupuesto.Loc_cod, presupuesto.pre_nro, 'aprobar')
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
                            {presupuesto.pre_vbggUsu || '-'}
                          </td>
                          <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                            {presupuesto.pre_vbggDt
                              ? formatDate(presupuesto.pre_vbggDt)
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() =>
                                handleAction(presupuesto.Loc_cod, presupuesto.pre_nro, 'desaprobar')
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
      {!isLoading && (!presupuestos || presupuestos.length === 0) && (
        <div className="text-center py-12 bg-slate-800 rounded-lg">
          <p className="text-slate-400 text-lg">
            No hay presupuestos {activeTab === 'pendientes' ? 'pendientes' : 'aprobados hoy'}
          </p>
        </div>
      )}

      {/* Modal de confirmación */}
      {selectedPresupuesto && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            // Cerrar modal si se hace click en el backdrop
            if (e.target === e.currentTarget) {
              setSelectedPresupuesto(null);
            }
          }}
        >
          <div 
            className="bg-slate-800 rounded-lg p-4 md:p-6 max-w-sm md:max-w-md w-full mx-2 border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg md:text-xl font-bold text-white mb-4 text-center">
              {modalAction === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Desaprobación'}
            </h3>
            <p className="text-slate-300 mb-6 text-center text-sm md:text-base">
              ¿Está seguro que desea {modalAction === 'aprobar' ? 'aprobar' : 'desaprobar'} el presupuesto N°{' '}
              <span className="font-bold" style={{ color: 'var(--tenant-primary)' }}>
                {selectedPresupuesto.pre_nro}
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
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setSelectedPresupuesto(null)}
                disabled={isPending}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium text-center touch-manipulation"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                disabled={isPending}
                className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation ${modalAction === 'aprobar'
                  ? ''
                  : 'bg-red-600 hover:bg-red-700 active:bg-red-700'
                  }`}
                style={modalAction === 'aprobar' ? { backgroundColor: 'var(--tenant-primary)' } : {}}
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

      {/* Modal de PDF */}
      {pdfModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9998] p-2 md:p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-7xl h-[95vh] md:h-[90vh] border border-slate-700 shadow-xl flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg md:text-xl font-bold text-white">
                Presupuesto N° {pdfModal.numeroPresupuesto}
              </h3>
              <div className="flex items-center gap-2">
                {pdfModal.pdfUrl && (
                  <button
                    onClick={() => pdfModal.numeroPresupuesto && handleDownloadPDF(pdfModal.numeroPresupuesto)}
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
            <div className="flex-1 overflow-hidden">
              {pdfModal.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-3 text-white">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Cargando PDF...</span>
                  </div>
                </div>
              ) : pdfModal.pdfUrl ? (
                <PDFViewer
                  pdfUrl={pdfModal.pdfUrl}
                  title={`Presupuesto ${pdfModal.numeroPresupuesto}`}
                  numeroDocumento={pdfModal.numeroPresupuesto || 0}
                  onDownload={handleDownloadPDF}
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
