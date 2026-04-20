'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { presupuestosApi } from '@/lib/api/presupuestos';
import { formatCurrency } from '@/lib/utils';
import { ItemPresupuesto, CostoItem, type AprobacionPresupuesto } from '@/lib/types';

const TIPO_BADGE: Record<number, { label: string; className: string }> = {
  1: { label: 'Material',         className: 'bg-slate-500/20 text-slate-300' },
  2: { label: 'Máquina',          className: 'bg-blue-500/20 text-blue-300' },
  3: { label: 'Servicio Externo', className: 'bg-orange-500/20 text-orange-300' },
  4: { label: 'Horas Técnicas',   className: 'bg-purple-500/20 text-purple-300' },
  5: { label: 'Margen',           className: 'bg-teal-500/20 text-teal-300' },
  6: { label: 'Descuento',        className: 'bg-red-500/20 text-red-300' },
};

function EtapaAprobacion({
  label,
  usuario,
  fecha,
  hora,
}: {
  label: string;
  usuario: string | null;
  fecha: string | null;
  hora: string | null;
}) {
  const aprobada = !!usuario;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${aprobada ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-700 border border-slate-600'}`}>
          {aprobada && <span className="text-emerald-400 text-[10px]">✓</span>}
        </div>
        <span className="text-xs font-medium text-slate-300 truncate">{label}</span>
      </div>
      <div className="text-xs text-slate-400 space-y-0.5 pl-6">
        <div>{usuario || '—'}</div>
        <div>{fecha ? fecha.split('-').reverse().join('-') : '—'}</div>
        <div>{hora || ''}</div>
      </div>
    </div>
  );
}

function AprobacionesCard({ aprobaciones }: { aprobaciones: Partial<AprobacionPresupuesto> }) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Flujo de Aprobaciones</h2>
      <div className="flex gap-4 divide-x divide-slate-700">
        <EtapaAprobacion
          label="Liberación"
          usuario={aprobaciones.pre_vblibusu ?? null}
          fecha={aprobaciones.pre_vblibdt ?? null}
          hora={aprobaciones.pre_vblibtime ?? null}
        />
        <div className="pl-4 flex-1 min-w-0">
          <EtapaAprobacion
            label="VB Gerente Operaciones"
            usuario={aprobaciones.pre_vbusu ?? null}
            fecha={aprobaciones.pre_vbfec ?? null}
            hora={aprobaciones.pre_vbtime ?? null}
          />
        </div>
        <div className="pl-4 flex-1 min-w-0">
          <EtapaAprobacion
            label="VB Gerente General"
            usuario={aprobaciones.pre_vbggusu ?? null}
            fecha={aprobaciones.pre_vbggdt ?? null}
            hora={aprobaciones.pre_vbggtime ?? null}
          />
        </div>
      </div>
    </div>
  );
}

function CostosTable({ costos }: { costos: CostoItem[] }) {
  if (costos.length === 0) return <p className="text-slate-500 text-sm px-4 py-2">Sin costos registrados</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-900/60 text-slate-400 text-xs">
          <th className="px-3 py-2 text-left">Tipo</th>
          <th className="px-3 py-2 text-left">Descripción</th>
          <th className="px-3 py-2 text-right">Cantidad</th>
          <th className="px-3 py-2 text-right">Precio</th>
          <th className="px-3 py-2 text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-700/50">
        {costos.map((c) => {
          const badge = TIPO_BADGE[c.Pre_DtTip] ?? { label: c.tipo_nombre, className: 'bg-slate-600/20 text-slate-400' };
          return (
            <tr key={`${c.pre_lin}-${c.pre_dtlin}`} className="text-slate-300">
              <td className="px-3 py-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </td>
              <td className="px-3 py-2">{c.Pre_DtDescrip || '—'}</td>
              <td className="px-3 py-2 text-right">{c.Pre_DtCant}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(c.Pre_DtPre)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(c.Pre_DtCant * c.Pre_DtPre)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ItemCard({ item }: { item: ItemPresupuesto }) {
  const [open, setOpen] = useState(false);
  const descripcion = [item.pre_des, item.pre_de1, item.pre_de2, item.pre_de3, item.pre_de4]
    .filter(Boolean).join(' — ');

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">Ítem #{item.pre_lin}</span>
            <span className="text-xs text-slate-500">{item.costos.length} costo(s)</span>
          </div>
          <p className="text-slate-200 text-sm truncate">{descripcion || '—'}</p>
          <div className="flex gap-4 mt-1 text-xs text-slate-400">
            <span>Cant: {item.pre_cpr}</span>
            <span>Precio: {formatCurrency(item.pre_pre)}</span>
            {item.pre_dct > 0 && <span>Dscto: {item.pre_dct}%</span>}
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0 ml-2" /> : <ChevronRight size={16} className="text-slate-400 flex-shrink-0 ml-2" />}
      </button>
      {open && (
        <div className="border-t border-slate-700 overflow-x-auto">
          <CostosTable costos={item.costos} />
        </div>
      )}
    </div>
  );
}

export default function DetallePresupuestoPage() {
  const params = useParams();
  const router = useRouter();
  const loc_cod = Number(params.loc_cod);
  const pre_nro = Number(params.pre_nro);

  const { data, isLoading, error } = useQuery({
    queryKey: ['presupuesto-detalle', loc_cod, pre_nro],
    queryFn: () => presupuestosApi.getDetalle(loc_cod, pre_nro),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const totalPrecio = data?.items.reduce((s, i) => s + i.pre_cpr * i.pre_pre, 0) ?? 0;
  const totalDescuento = data?.items.reduce((s, i) => s + i.pre_dct, 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            Presupuesto #{pre_nro}
          </h1>
          <p className="text-sm text-slate-400">Sucursal {loc_cod}</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          Error al cargar el detalle del presupuesto.
        </div>
      )}

      {data && (
        <>
          {/* Flujo de Aprobaciones */}
          <AprobacionesCard aprobaciones={data.aprobaciones ?? {}} />

          {/* Vista Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {data.items.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Sin ítems registrados</p>
            ) : (
              data.items.map((item) => <ItemCard key={item.pre_lin} item={item} />)
            )}
          </div>

          {/* Vista Desktop: Tabla expandible */}
          <div className="hidden lg:block bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-xs">
                  <th className="px-4 py-3 text-left w-8"></th>
                  <th className="px-4 py-3 text-left">Ítem</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-right">Descuento %</th>
                  <th className="px-4 py-3 text-right">Costos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-8">Sin ítems registrados</td></tr>
                ) : (
                  data.items.map((item) => <ExpandableRow key={item.pre_lin} item={item} />)
                )}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          {data.items.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-sm space-y-1 min-w-64">
                <div className="flex justify-between text-slate-400">
                  <span>Total precio:</span>
                  <span className="text-slate-200 font-medium">{formatCurrency(totalPrecio)}</span>
                </div>
                {totalDescuento > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Descuento promedio:</span>
                    <span className="text-red-400 font-medium">{(totalDescuento / data.items.length).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExpandableRow({ item }: { item: ItemPresupuesto }) {
  const [open, setOpen] = useState(false);
  const descripcion = [item.pre_des, item.pre_de1, item.pre_de2, item.pre_de3, item.pre_de4]
    .filter(Boolean).join(' — ');

  return (
    <>
      <tr
        className="hover:bg-slate-700/30 cursor-pointer transition-colors"
        onClick={() => setOpen(!open)}
      >
        <td className="px-4 py-3 text-slate-400">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
        <td className="px-4 py-3 text-slate-300 font-medium">#{item.pre_lin}</td>
        <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{descripcion || '—'}</td>
        <td className="px-4 py-3 text-slate-300 text-right">{item.pre_cpr}</td>
        <td className="px-4 py-3 text-slate-300 text-right">{formatCurrency(item.pre_pre)}</td>
        <td className="px-4 py-3 text-slate-300 text-right">{item.pre_dct > 0 ? `${item.pre_dct}%` : '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-right">{item.costos.length}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="bg-slate-900/40 px-4 py-0">
            <div className="overflow-x-auto py-2">
              <CostosTable costos={item.costos} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
