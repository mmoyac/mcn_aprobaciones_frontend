'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ordenesApi } from '@/lib/api/ordenes';
import { formatCurrency } from '@/lib/utils';
import { type AprobacionOrdenCompra, type ItemOrdenCompra } from '@/lib/types';

const ESTADO: Record<string, string> = {
  T: 'Recepcionada',
  I: 'Pendiente',
  N: 'Anulada',
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

function AprobacionesCard({ aprobaciones }: { aprobaciones: Partial<AprobacionOrdenCompra> }) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Flujo de Aprobaciones</h2>
      <div className="flex gap-4 divide-x divide-slate-700">
        <EtapaAprobacion
          label="VB Técnico"
          usuario={aprobaciones.ocp_a4usu ?? null}
          fecha={aprobaciones.ocp_a4_dt ?? null}
          hora={aprobaciones.ocp_a4_hr ?? null}
        />
        <div className="pl-4 flex-1 min-w-0">
          <EtapaAprobacion
            label="VB Contabilidad"
            usuario={aprobaciones.ocp_a3usu ?? null}
            fecha={aprobaciones.ocp_a3_dt ?? null}
            hora={aprobaciones.ocp_a3_hr ?? null}
          />
        </div>
        <div className="pl-4 flex-1 min-w-0">
          <EtapaAprobacion
            label="VB Operaciones"
            usuario={aprobaciones.ocp_a2usu ?? null}
            fecha={aprobaciones.ocp_a2_dt ?? null}
            hora={aprobaciones.ocp_a2_hr ?? null}
          />
        </div>
        <div className="pl-4 flex-1 min-w-0">
          <EtapaAprobacion
            label="VB Gerente General"
            usuario={aprobaciones.ocp_a1usu ?? null}
            fecha={aprobaciones.ocp_a1_dt ?? null}
            hora={aprobaciones.ocp_a1_hr ?? null}
          />
        </div>
      </div>
    </div>
  );
}

function ItemsTable({ items }: { items: ItemOrdenCompra[] }) {
  const titulo = (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
      Items de la Orden <span className="text-slate-500 font-normal normal-case">({items.length})</span>
    </h2>
  );

  if (items.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        {titulo}
        <p className="text-xs text-slate-500">No se encontraron items para esta orden.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-3">
      {titulo}

      {/* Cards: móvil */}
      <div className="md:hidden space-y-2">
        {items.map((item) => (
          <div key={item.ocp_lin} className="rounded border border-slate-700 bg-slate-750 p-2.5 space-y-1.5">
            {/* Fila superior: línea + material + estado */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">#{item.ocp_lin}</span>
              <span className="text-[10px] font-medium text-slate-300 flex-1">{item.ocp_mat ?? '—'}</span>
              {item.Ocp_est && (
                <span className="text-[10px] text-slate-400 border border-slate-600 rounded px-1">{item.Ocp_est}</span>
              )}
            </div>
            {/* Nombre material */}
            {item.mat_des && (
              <p className="text-xs font-medium text-slate-200">{item.mat_des}</p>
            )}
            {/* OT */}
            {item.Ocp_Odt != null && (
              <p className="text-[10px] text-slate-400">OT: <span className="text-slate-300">{item.Ocp_Odt}</span></p>
            )}
            {/* Descripciones */}
            {[item.Ocp_De1, item.Ocp_De2, item.Ocp_De3].some(Boolean) && (
              <div className="text-[10px] text-slate-400 space-y-0.5">
                {item.Ocp_De1 && <p>{item.Ocp_De1}</p>}
                {item.Ocp_De2 && <p>{item.Ocp_De2}</p>}
                {item.Ocp_De3 && <p>{item.Ocp_De3}</p>}
              </div>
            )}
            {/* Cantidad / Precio */}
            <div className="flex justify-between pt-0.5 border-t border-slate-700">
              <span className="text-[10px] text-slate-500">Cant: <span className="text-slate-300">{item.Ocp_can ?? '—'}</span></span>
              <span className="text-xs font-medium text-slate-200">{item.Ocp_pre != null ? formatCurrency(item.Ocp_pre) : '—'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla: desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="pb-1.5 pr-3 font-medium text-slate-500">#</th>
              <th className="pb-1.5 pr-3 font-medium text-slate-500">ID</th>
              <th className="pb-1.5 pr-3 font-medium text-slate-500">Material</th>
              <th className="pb-1.5 pr-3 font-medium text-slate-500">OT</th>
              <th className="pb-1.5 pr-3 font-medium text-slate-500">Descripción</th>
              <th className="pb-1.5 pr-3 font-medium text-slate-500">Est.</th>
              <th className="pb-1.5 pr-3 font-medium text-slate-500 text-right">Cant.</th>
              <th className="pb-1.5 font-medium text-slate-500 text-right">Precio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {items.map((item) => (
              <tr key={item.ocp_lin} className="hover:bg-slate-700/30 transition-colors">
                <td className="py-1.5 pr-3 text-slate-400">{item.ocp_lin}</td>
                <td className="py-1.5 pr-3 text-slate-300 whitespace-nowrap">{item.ocp_mat ?? '—'}</td>
                <td className="py-1.5 pr-3 text-slate-200 whitespace-nowrap">{item.mat_des || '—'}</td>
                <td className="py-1.5 pr-3 text-slate-300 whitespace-nowrap">{item.Ocp_Odt ?? '—'}</td>
                <td className="py-1.5 pr-3 text-slate-300">
                  {[item.Ocp_De1, item.Ocp_De2, item.Ocp_De3].some(Boolean) ? (
                    <div className="space-y-0.5">
                      {item.Ocp_De1 && <div>{item.Ocp_De1}</div>}
                      {item.Ocp_De2 && <div>{item.Ocp_De2}</div>}
                      {item.Ocp_De3 && <div>{item.Ocp_De3}</div>}
                    </div>
                  ) : '—'}
                </td>
                <td className="py-1.5 pr-3 text-slate-300 whitespace-nowrap">{item.Ocp_est || '—'}</td>
                <td className="py-1.5 pr-3 text-slate-200 text-right whitespace-nowrap">{item.Ocp_can ?? '—'}</td>
                <td className="py-1.5 text-slate-200 text-right whitespace-nowrap">{item.Ocp_pre != null ? formatCurrency(item.Ocp_pre) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DetalleOrdenCompraPage() {
  const params = useParams();
  const router = useRouter();
  const loc_cod = Number(params.loc_cod);
  const ocp_nro = Number(params.ocp_nro);

  const { data, isLoading, error } = useQuery({
    queryKey: ['orden-compra-detalle', loc_cod, ocp_nro],
    queryFn: () => ordenesApi.getDetalle(loc_cod, ocp_nro),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['orden-compra-items', loc_cod, ocp_nro],
    queryFn: () => ordenesApi.getItems(loc_cod, ocp_nro),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
            Orden de Compra #{ocp_nro}
          </h1>
          <p className="text-sm text-slate-400">Sucursal {loc_cod}{data?.loc_des ? ` — ${data.loc_des}` : ''}</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          Error al cargar el detalle de la orden de compra.
        </div>
      )}

      {data && (
        <>
          {/* Flujo de Aprobaciones */}
          <AprobacionesCard aprobaciones={data.aprobaciones ?? {}} />

          {/* Info general */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">Proveedor</p>
              <p className="text-slate-200 font-medium">{data.proveedor_nombre}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Fecha OC</p>
              <p className="text-slate-200">{data.ocp_fec ? data.ocp_fec.split('-').reverse().join('-') : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Fecha Entrega</p>
              <p className="text-slate-200">{data.ocp_fee ? data.ocp_fee.split('-').reverse().join('-') : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Estado</p>
              <p className="text-slate-200">{ESTADO[data.ocp_pdt] ?? data.ocp_pdt}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Neto</p>
              <p className="text-slate-200">{formatCurrency(data.ocp_net)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">IVA</p>
              <p className="text-slate-200">{formatCurrency(data.ocp_iva)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Imp. Adicional</p>
              <p className="text-slate-200">{formatCurrency(data.ocp_ila)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total</p>
              <p className="text-slate-100 font-bold">{formatCurrency(data.monto_total)}</p>
            </div>
          </div>

          {/* Items de la orden */}
          {itemsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : (
            <ItemsTable items={items} />
          )}
        </>
      )}
    </div>
  );
}
