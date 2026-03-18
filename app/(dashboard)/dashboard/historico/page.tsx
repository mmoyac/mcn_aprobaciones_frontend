'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Loader2, ClipboardList, Eye, Download, Share2, AlertTriangle, FileX, X } from 'lucide-react';
import { presupuestosApi } from '@/lib/api/presupuestos';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PresupuestoHistorico } from '@/lib/types';
import PDFViewer from '@/components/PDFViewer';

function BadgeEstado({ est }: { est: string }) {
  const e = est?.trim().toUpperCase();
  switch (e) {
    case 'N': return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">No Vigente</span>;
    case 'P': return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Perdido</span>;
    case 'G': return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400">Ganado</span>;
    default:  return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Sin Asignación</span>;
  }
}

function BadgeVB({ vb }: { vb: number }) {
  return vb === 1
    ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Aprobado</span>
    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">Pendiente</span>;
}

function PdfButtons({ p, onView, onDownload, onShare }: {
  p: PresupuestoHistorico;
  onView: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  if (p.tienepdf === 1) {
    return (
      <div className="flex gap-1">
        <button onClick={onView} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors" title="Ver PDF">
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDownload} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors" title="Descargar PDF">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={onShare} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors" title="Compartir PDF">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  if (p.tienepdf === 2) {
    return <span title="Sin contenido PDF"><AlertTriangle className="w-4 h-4 text-amber-400" /></span>;
  }
  return <span title="Sin PDF"><FileX className="w-4 h-4 text-red-400/50" /></span>;
}

export default function HistoricoPage() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [query, setQuery] = useState('');

  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    pre_nro: number | null;
    loc_cod: number | null;
    pdfUrl: string | null;
    isLoading: boolean;
  }>({ isOpen: false, pre_nro: null, loc_cod: null, pdfUrl: null, isLoading: false });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['historico', query],
    queryFn: () => presupuestosApi.buscarHistorico(query),
    enabled: query.length >= 3,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleBuscar = () => {
    if (busqueda.trim().length >= 3) setQuery(busqueda.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBuscar();
  };

  const openPdf = async (pre_nro: number, loc_cod: number) => {
    setPdfModal({ isOpen: true, pre_nro, loc_cod, pdfUrl: null, isLoading: true });
    try {
      const blob = await presupuestosApi.getPDF(pre_nro, loc_cod);
      setPdfModal(prev => ({ ...prev, pdfUrl: URL.createObjectURL(blob), isLoading: false }));
    } catch (error: any) {
      alert(`Error al cargar PDF: ${error.message}`);
      setPdfModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const downloadPdf = async (pre_nro: number, loc_cod: number) => {
    try {
      const blob = await presupuestosApi.getPDF(pre_nro, loc_cod);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `presupuesto-${pre_nro}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(`Error al descargar PDF: ${error.message}`);
    }
  };

  const sharePdf = async (pre_nro: number, loc_cod: number) => {
    try {
      const blob = await presupuestosApi.getPDF(pre_nro, loc_cod);
      const file = new File([blob], `presupuesto-${pre_nro}.pdf`, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Presupuesto N° ${pre_nro}` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `presupuesto-${pre_nro}.pdf`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') alert(`Error al compartir: ${error.message}`);
    }
  };

  const closePdfModal = () => {
    if (pdfModal.pdfUrl) URL.revokeObjectURL(pdfModal.pdfUrl);
    setPdfModal({ isOpen: false, pre_nro: null, loc_cod: null, pdfUrl: null, isLoading: false });
  };

  const mostrandoResultados = query.length >= 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Historial de Presupuestos</h1>
          <p className="text-sm text-slate-400">Busca por cliente o referencia</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex gap-2">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe cliente o referencia (mín. 3 caracteres)..."
          className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
        />
        <button
          onClick={handleBuscar}
          disabled={busqueda.trim().length < 3}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Search size={16} />
          Buscar
        </button>
      </div>

      {/* Loading */}
      {(isLoading || isFetching) && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" size={28} />
        </div>
      )}

      {/* Sin búsqueda aún */}
      {!mostrandoResultados && !isLoading && (
        <div className="text-center py-16 text-slate-500">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>Ingresa un cliente o referencia para buscar</p>
        </div>
      )}

      {/* Sin resultados */}
      {mostrandoResultados && !isLoading && !isFetching && data?.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p>Sin resultados para <span className="text-slate-300">"{query}"</span></p>
        </div>
      )}

      {/* Resultados */}
      {data && data.length > 0 && !isFetching && (
        <>
          <p className="text-sm text-slate-400">
            {data.length} resultado{data.length !== 1 ? 's' : ''} para <span className="text-slate-200">"{query}"</span>
            {data.length === 50 && <span className="text-amber-400"> (máx. 50)</span>}
          </p>

          {/* Mobile */}
          <div className="lg:hidden space-y-3">
            {data.map((p) => (
              <div key={`${p.Loc_cod}-${p.pre_nro}`} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Link
                      href={`/dashboard/presupuestos/${p.Loc_cod}/${p.pre_nro}`}
                      className="text-sm font-mono text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1"
                    >
                      #{p.pre_nro} <ClipboardList size={12} />
                    </Link>
                    <p className="text-white font-medium mt-0.5">{p.cliente_nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{p.pre_fec ? formatDate(p.pre_fec) : '-'}</p>
                    <p className="text-teal-400 font-bold mt-0.5">{formatCurrency(p.Pre_Neto)}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 truncate mb-2">{p.pre_ref || '-'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <BadgeEstado est={p.pre_est} />
                    <BadgeVB vb={p.pre_vbgg} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/presupuestos/${p.Loc_cod}/${p.pre_nro}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                      title="Ver detalle"
                    >
                      <ClipboardList size={14} />
                    </Link>
                    <PdfButtons
                      p={p}
                      onView={() => openPdf(p.pre_nro, p.Loc_cod)}
                      onDownload={() => downloadPdf(p.pre_nro, p.Loc_cod)}
                      onShare={() => sharePdf(p.pre_nro, p.Loc_cod)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden lg:block bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 text-left">N°</th>
                  <th className="px-3 py-3 text-left whitespace-nowrap">Fecha</th>
                  <th className="px-3 py-3 text-left">Cliente</th>
                  <th className="px-3 py-3 text-left">Referencia</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">Neto</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                  <th className="px-3 py-3 text-center">VB</th>
                  <th className="px-3 py-3 text-center">PDF</th>
                  <th className="px-3 py-3 text-center">Det.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.map((p) => (
                  <tr key={`${p.Loc_cod}-${p.pre_nro}`} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-3 py-3 text-slate-300 font-medium whitespace-nowrap">#{p.pre_nro}</td>
                    <td className="px-3 py-3 text-slate-300 whitespace-nowrap">{p.pre_fec ? formatDate(p.pre_fec) : '-'}</td>
                    <td className="px-3 py-3 text-slate-200 max-w-[180px] truncate">{p.cliente_nombre}</td>
                    <td className="px-3 py-3 text-slate-400 max-w-[160px] truncate" title={p.pre_ref}>{p.pre_ref || '-'}</td>
                    <td className="px-3 py-3 text-right text-white font-semibold whitespace-nowrap">{formatCurrency(p.Pre_Neto)}</td>
                    <td className="px-3 py-3 text-center"><BadgeEstado est={p.pre_est} /></td>
                    <td className="px-3 py-3 text-center"><BadgeVB vb={p.pre_vbgg} /></td>
                    <td className="px-3 py-3 text-center">
                      <PdfButtons
                        p={p}
                        onView={() => openPdf(p.pre_nro, p.Loc_cod)}
                        onDownload={() => downloadPdf(p.pre_nro, p.Loc_cod)}
                        onShare={() => sharePdf(p.pre_nro, p.Loc_cod)}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link
                        href={`/dashboard/presupuestos/${p.Loc_cod}/${p.pre_nro}`}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                        title="Ver detalle"
                      >
                        <ClipboardList size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal PDF */}
      {pdfModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9998] p-2 md:p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-7xl h-[95vh] md:h-[90vh] border border-slate-700 shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Presupuesto N° {pdfModal.pre_nro}</h3>
              <div className="flex items-center gap-2">
                {pdfModal.pdfUrl && (
                  <button
                    onClick={() => pdfModal.pre_nro && pdfModal.loc_cod && downloadPdf(pdfModal.pre_nro, pdfModal.loc_cod)}
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
            <div className="flex-1 overflow-hidden">
              {pdfModal.isLoading ? (
                <div className="flex items-center justify-center h-full gap-3 text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Cargando PDF...</span>
                </div>
              ) : pdfModal.pdfUrl ? (
                <PDFViewer
                  pdfUrl={pdfModal.pdfUrl}
                  title={`Presupuesto ${pdfModal.pre_nro}`}
                  numeroDocumento={pdfModal.pre_nro || 0}
                  onDownload={(num) => downloadPdf(num, pdfModal.loc_cod ?? 0)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center text-red-400">
                  <div>
                    <FileX className="w-12 h-12 mx-auto mb-3" />
                    <p>Error al cargar el PDF</p>
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
