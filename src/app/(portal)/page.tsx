'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  counts: { leads: number; proposals: number; projects: number; activities: number };
  leadsByStatus: { status: string; _count: number }[];
  proposalsByStatus: { status: string; _count: number }[];
  projectsByStatus: { status: string; _count: number }[];
  totalEstimatedValue: number;
  conversionRate: number;
  leadsGanados: number;
  leadsInactivos: { id: string; companyName: string; status: string; updatedAt: string }[];
  propuestasSinRespuesta: { id: string; title: string; amount: number; sentDate: string }[];
  proximosDeadlines: { id: string; name: string; endDate: string; progress: number; priority: string }[];
  topSocios: { id: string; name: string; role: string; _count: { leads: number; proposals: number; projects: number } }[];
  embudo: { status: string; count: number; valor: number }[];
  industriaLeads: { source: string; _count: number }[];
  metaMensual: number;
  ingresosMes: number;
  recentActivities: { id: string; type: string; description: string; entityType: string; createdAt: string; user: { name: string } }[];
}

const tendencias = [
  { mes: 'Nov', leads: 3, ingresos: 8000,  proyectos: 1 },
  { mes: 'Dic', leads: 5, ingresos: 12000, proyectos: 2 },
  { mes: 'Ene', leads: 4, ingresos: 15000, proyectos: 2 },
  { mes: 'Feb', leads: 7, ingresos: 18500, proyectos: 3 },
  { mes: 'Mar', leads: 6, ingresos: 22000, proyectos: 3 },
  { mes: 'Abr', leads: 9, ingresos: 27000, proyectos: 4 },
];

const ETAPA_LABELS: Record<string, string> = {
  NEW: 'Nuevo', CONTACTED: 'Contactado', QUALIFIED: 'Calificado',
  PROPOSAL_SENT: 'Propuesta', NEGOTIATION: 'Negociación', WON: 'Ganado',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-400', MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400', CRITICAL: 'text-red-400',
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<'ingresos' | 'leads' | 'proyectos'>('ingresos');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  const maxVal = Math.max(...tendencias.map(t =>
    chartTab === 'ingresos' ? t.ingresos : chartTab === 'leads' ? t.leads : t.proyectos
  ));

  const metaPct = data ? Math.min(Math.round((data.ingresosMes / data.metaMensual) * 100), 100) : 0;
  const maxEmbudo = data?.embudo[0]?.count || 1;
  const alertas = (data?.leadsInactivos.length ?? 0) + (data?.propuestasSinRespuesta.length ?? 0) + (data?.proximosDeadlines.length ?? 0);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Resumen general de ArchiTechIA</p>
        </div>
        {alertas > 0 && (
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {alertas} {alertas === 1 ? 'alerta' : 'alertas'} requieren atención
          </div>
        )}
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads',     value: data?.counts.leads ?? 0,     sub: `$${(data?.totalEstimatedValue ?? 0).toLocaleString()} en pipeline`, color: 'text-white',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Propuestas',      value: data?.counts.proposals ?? 0, sub: 'En seguimiento activo',                                              color: 'text-white',      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Tasa Conversión', value: `${data?.conversionRate ?? 0}%`, sub: `${data?.leadsGanados ?? 0} leads ganados`,                      color: 'text-green-400',  icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { label: 'Proyectos',       value: data?.counts.projects ?? 0,  sub: 'En desarrollo y completados',                                        color: 'text-white',      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
        ].map((k) => (
          <div key={k.label} className="bg-gray-900 rounded-xl p-5 border border-orange-500/20 hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">{k.label}</p>
              <div className="w-9 h-9 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={k.icon} />
                </svg>
              </div>
            </div>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Meta mensual + Top socios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Meta mensual de ingresos */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">Meta Mensual</h3>
          <div className="flex items-end justify-between mb-2">
            <p className="text-2xl font-bold text-white">${data?.ingresosMes.toLocaleString()}</p>
            <p className="text-sm text-gray-400">de ${data?.metaMensual.toLocaleString()}</p>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all ${metaPct >= 100 ? 'bg-green-500' : metaPct >= 70 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${metaPct}%` }}
            />
          </div>
          <p className={`text-sm font-semibold ${metaPct >= 100 ? 'text-green-400' : metaPct >= 70 ? 'text-orange-400' : 'text-red-400'}`}>
            {metaPct}% completado
          </p>
        </div>

        {/* Top socios */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">Top Socios</h3>
          <div className="space-y-3">
            {data?.topSocios.map((socio, i) => (
              <div key={socio.id} className="flex items-center gap-3">
                <span className={`text-lg font-bold w-6 flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : 'text-orange-700'}`}>
                  #{i + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                  {socio.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{socio.name}</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-400 flex-shrink-0">
                  <span className="flex items-center gap-1"><span className="text-orange-400 font-semibold">{socio._count.leads}</span> leads</span>
                  <span className="flex items-center gap-1"><span className="text-blue-400 font-semibold">{socio._count.proposals}</span> prop.</span>
                  <span className="flex items-center gap-1"><span className="text-green-400 font-semibold">{socio._count.projects}</span> proy.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Embudo de ventas + Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Embudo de ventas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-5">Embudo de Ventas</h3>
          <div className="space-y-2">
            {data?.embudo.map((etapa, i) => {
              const pct = Math.round((etapa.count / maxEmbudo) * 100);
              const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-green-500'];
              return (
                <div key={etapa.status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">{ETAPA_LABELS[etapa.status]}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">${etapa.valor.toLocaleString()}</span>
                      <span className="text-white font-semibold w-4 text-right">{etapa.count}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className={`${colors[i]} h-2 rounded-full transition-all`} style={{ width: `${pct || 2}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tendencias mensuales */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Tendencias</h3>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              {(['ingresos', 'leads', 'proyectos'] as const).map((t) => (
                <button key={t} onClick={() => setChartTab(t)}
                  className={`px-2 py-1 text-xs rounded-md capitalize transition-colors ${chartTab === t ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {tendencias.map((t) => {
              const val = chartTab === 'ingresos' ? t.ingresos : chartTab === 'leads' ? t.leads : t.proyectos;
              const h = Math.round((val / maxVal) * 112);
              return (
                <div key={t.mes} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div className="w-full rounded-t bg-gradient-to-t from-orange-600 to-orange-400 group-hover:from-orange-500 group-hover:to-orange-300 transition-all"
                      style={{ height: `${h}px` }} />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border border-gray-700 text-xs text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                      {chartTab === 'ingresos' ? `$${(val as number).toLocaleString()}` : val}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{t.mes}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-6 gap-1">
            {tendencias.map((t) => {
              const val = chartTab === 'ingresos' ? t.ingresos : chartTab === 'leads' ? t.leads : t.proyectos;
              return (
                <p key={t.mes} className="text-xs font-semibold text-orange-400 text-center">
                  {chartTab === 'ingresos' ? `$${((val as number) / 1000).toFixed(0)}k` : val}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alertas inteligentes */}
      {alertas > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Alertas Inteligentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Leads inactivos */}
            {(data?.leadsInactivos.length ?? 0) > 0 && (
              <div className="bg-yellow-900/10 border border-yellow-800/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-yellow-400 mb-2">⏰ Leads sin actividad +7 días</p>
                <div className="space-y-1">
                  {data?.leadsInactivos.map(l => (
                    <p key={l.id} className="text-xs text-gray-300 truncate">• {l.companyName}</p>
                  ))}
                </div>
              </div>
            )}
            {/* Propuestas sin respuesta */}
            {(data?.propuestasSinRespuesta.length ?? 0) > 0 && (
              <div className="bg-red-900/10 border border-red-800/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-red-400 mb-2">📄 Propuestas sin respuesta +5 días</p>
                <div className="space-y-1">
                  {data?.propuestasSinRespuesta.map(p => (
                    <p key={p.id} className="text-xs text-gray-300 truncate">• {p.title}</p>
                  ))}
                </div>
              </div>
            )}
            {/* Próximos deadlines */}
            {(data?.proximosDeadlines.length ?? 0) > 0 && (
              <div className="bg-orange-900/10 border border-orange-800/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-orange-400 mb-2">🗓️ Deadlines próximos 7 días</p>
                <div className="space-y-1">
                  {data?.proximosDeadlines.map(p => (
                    <div key={p.id} className="flex items-center justify-between">
                      <p className="text-xs text-gray-300 truncate flex-1">{p.name}</p>
                      <span className={`text-xs ml-2 flex-shrink-0 ${PRIORITY_COLORS[p.priority]}`}>
                        {new Date(p.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Distribución por fuente + Estados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fuentes de leads */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">Fuentes de Leads</h3>
          <div className="space-y-3">
            {data?.industriaLeads.map((item) => {
              const total = data.industriaLeads.reduce((a, b) => a + b._count, 0);
              const pct = Math.round((item._count / total) * 100);
              return (
                <div key={item.source}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{item.source}</span>
                    <span className="text-orange-400">{item._count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leads por estado */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">Leads por Estado</h3>
          <div className="space-y-3">
            {data?.leadsByStatus.map(item => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{translateStatus(item.status)}</span>
                <span className="font-semibold text-orange-400">{item._count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Propuestas por estado */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">Propuestas por Estado</h3>
          <div className="space-y-3">
            {data?.proposalsByStatus.map(item => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{translateStatus(item.status)}</span>
                <span className="font-semibold text-orange-400">{item._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          {data?.recentActivities.map(activity => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-800">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-orange-500">{activity.user.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">{activity.user.name}</span> {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(activity.createdAt).toLocaleString('es-ES')} · <span className="text-orange-500">{activity.entityType}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function translateStatus(status: string): string {
  const t: Record<string, string> = {
    NEW: 'Nuevo', CONTACTED: 'Contactado', QUALIFIED: 'Calificado',
    PROPOSAL_SENT: 'Propuesta Enviada', NEGOTIATION: 'Negociación',
    WON: 'Ganado', LOST: 'Perdido', DRAFT: 'Borrador', SENT: 'Enviado',
    UNDER_REVIEW: 'En Revisión', ACCEPTED: 'Aceptado', REJECTED: 'Rechazado',
    PLANNING: 'Planificación', IN_PROGRESS: 'En Progreso', ON_HOLD: 'En Pausa',
    COMPLETED: 'Completado', CANCELLED: 'Cancelado',
  };
  return t[status] || status;
}
