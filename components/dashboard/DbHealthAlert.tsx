'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { AlertTriangle, CheckCircle, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface TableCheck {
  tabla: string;
  existe: boolean;
  columnas_faltantes: string[];
  columnas_extra: string[];
  ok: boolean;
}

interface DbCheckResponse {
  tenant: string;
  base_de_datos: string;
  checks: TableCheck[];
  tiene_errores: boolean;
}

async function fetchDbCheck(): Promise<DbCheckResponse> {
  const { data } = await apiClient.get<DbCheckResponse>('/tenant/db-check');
  return data;
}

export default function DbHealthAlert() {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tenant', 'db-check'],
    queryFn: fetchDbCheck,
    staleTime: 60 * 1000,
    retry: false,
  });

  if (isLoading) return null;
  if (isError || !data) return null;
  if (!data.tiene_errores) return null;

  const tablasFallidas = data.checks.filter(c => !c.ok);

  return (
    <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-300">
              Incompatibilidad detectada en la base de datos
            </p>
            <p className="text-xs text-amber-400/80">
              BD: <span className="font-mono">{data.base_de_datos}</span> —{' '}
              {tablasFallidas.length} tabla{tablasFallidas.length !== 1 ? 's' : ''} con problemas
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-amber-400" />
          : <ChevronDown className="w-4 h-4 text-amber-400" />
        }
      </button>

      {/* Detalle expandible */}
      {expanded && (
        <div className="border-t border-amber-500/30 px-4 pb-4 space-y-3 pt-3">
          {data.checks.map((check) => (
            <div key={check.tabla} className="flex items-start gap-3">
              {check.ok
                ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                : <Database className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-mono font-semibold ${check.ok ? 'text-green-300' : 'text-red-300'}`}>
                  {check.tabla}
                  {!check.existe && <span className="ml-2 text-xs font-sans font-normal text-red-400">(tabla no encontrada)</span>}
                </p>
                {check.columnas_faltantes.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Columnas faltantes:{' '}
                    <span className="font-mono text-red-300">
                      {check.columnas_faltantes.join(', ')}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
