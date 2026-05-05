'use client';

import { useEffect, useState } from 'react';

interface KPIs {
  totalLeads: number; leadsGanados: number; leadsPerdidos: number;
  winRate: number; avgDealSize: number; totalPipeline: number;
  totalProposals: number; propAceptadas: number; acceptanceRate: number;
  totalIngresos: number;
}

interface ReportData {
  kpis: KPIs;
  revenueMensual: { mes: string; ingresos: number; deals: number }[];
  pipelineEtapas: { status: string; label: string; count: number; valor: number }[];
  revenueCategorias: { cat: string; total: number }[];
  propEstados: { status: string; count: number; valor: number }[];
  topSocios: { id: string; name: string; role: string; _count: { leads: number; proposals: number } }[];
}

const PROP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', SENT: 'Enviado', UNDER_REVIEW: 'En Revisión',
  ACCEPTED: 'Aceptado', REJECTED: 'Rechazado',
};

const PROP_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-gray-400', SENT: 'text-orange-400', UNDER_REVIEW: 'text-yellow-400',
  ACCEPTED: 'text-green-400', REJECTED: 'text-red-400',
};

function Bar({ value, max, color = 'bg-orange-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function ReportesPage() {
  const [data, setData]     = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reportes')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-400">Error al cargar reportes.</p>
    </div>
  );

  const { kpis, revenueMensual, pipelineEtapas, revenueCategorias, propEstados, topSocios } = data;
  const maxRevenue = Math.max(...revenueMensual.map(m => m.ingresos), 1);
  const maxEtapa   = Math.max(...pipelineEtapas.map(e => e.count), 1);
  const maxCat     = Math.max(...revenueCategorias.map(c => c.total), 1);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Reportes</h1>
        <p className="text-gray-400 mt-1">Métricas de ventas, pipeline y rendimiento del equipo</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Leads',      value: kpis.totalLeads,                       color: 'text-white' },
          { label: 'Win Rate',         value: `${kpis.winRate}%`,                    color: 'text-green-400' },
          { label: 'Ticket Promedio',  value: `$${kpis.avgDealSize.toLocaleString()}`, color: 'text-orange-400' },
          { label: 'Tasa Aceptación',  value: `${kpis.acceptanceRate}%`,             color: 'text-blue-400' },
          { label: 'Ingresos Totales', value: `$${kpis.totalIngresos.toLocaleString()}`, color: 'text-purple-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue mensual + Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue por mes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Ingresos por mes (últimos 6)</h2>
          <div className="space-y-4">
            {revenueMensual.map(m => (
              <div key={m.mes}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{m.mes}</span>
                  <span className="text-white font-medium">${m.ingresos.toLocaleString()}</span>
                </div>
                <Bar value={m.ingresos} max={maxRevenue} color="bg-orange-500" />
                <p className="text-xs text-gray-500 mt-0.5">{m.deals} deals cerrados</p>
              </div>
            ))}
            {revenueMensual.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin datos</p>}
          </div>
        </div>

        {/* Pipeline por etapa */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Pipeline por etapa</h2>
          <div className="space-y-3">
            {pipelineEtapas.map(e => (
              <div key={e.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{e.label}</span>
                  <span className="text-white font-medium">{e.count} lead{e.count !== 1 ? 's' : ''} · ${e.valor.toLocaleString()}</span>
                </div>
                <Bar value={e.count} max={maxEtapa} color="bg-blue-500" />
              </div>
            ))}
            {pipelineEtapas.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin datos</p>}
          </div>
        </div>
      </div>

      {/* Revenue por categoría + Propuestas por estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categorías */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Ingresos por categoría</h2>
          <div className="space-y-3">
            {revenueCategorias.map(c => (
              <div key={c.cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{c.cat}</span>
                  <span className="text-white font-medium">${c.total.toLocaleString()}</span>
                </div>
                <Bar value={c.total} max={maxCat} color="bg-purple-500" />
              </div>
            ))}
            {revenueCategorias.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin datos</p>}
          </div>
        </div>

        {/* Propuestas por estado */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Propuestas por estado</h2>
          <div className="space-y-3">
            {propEstados.filter(e => e.count > 0).map(e => (
              <div key={e.status} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className={`text-sm font-medium ${PROP_STATUS_COLORS[e.status] ?? 'text-gray-400'}`}>
                  {PROP_STATUS_LABELS[e.status] ?? e.status}
                </span>
                <div className="text-right">
                  <span className="text-white font-bold">{e.count}</span>
                  <span className="text-gray-400 text-xs ml-2">${e.valor.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {propEstados.every(e => e.count === 0) && <p className="text-gray-500 text-sm text-center py-4">Sin datos</p>}
          </div>
        </div>
      </div>

      {/* Top socios */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Rendimiento del equipo</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {topSocios.map(s => (
            <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">{s.name?.split(' ').filter(w => w.length > 0).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')}</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{s.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s._count.leads} leads · {s._count.proposals} propuestas</p>
              </div>
            </div>
          ))}
          {topSocios.length === 0 && <p className="text-gray-500 text-sm col-span-full text-center py-4">Sin datos</p>}
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Resumen ejecutivo</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Leads ganados',   value: kpis.leadsGanados,    sub: `de ${kpis.totalLeads} totales`,        color: 'text-green-400' },
            { label: 'Leads perdidos',  value: kpis.leadsPerdidos,   sub: `${100 - kpis.winRate}% tasa pérdida`,  color: 'text-red-400' },
            { label: 'Pipeline total',  value: `$${kpis.totalPipeline.toLocaleString()}`, sub: 'excl. perdidos',  color: 'text-orange-400' },
            { label: 'Prop. aceptadas', value: kpis.propAceptadas,   sub: `de ${kpis.totalProposals} enviadas`,   color: 'text-blue-400' },
          ].map(k => (
            <div key={k.label} className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
