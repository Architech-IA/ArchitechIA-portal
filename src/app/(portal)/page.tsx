'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  counts: { leads: number; proposals: number; projects: number; activities: number };
  leadsByStatus: { status: string; _count: number }[];
  proposalsByStatus: { status: string; _count: number }[];
  projectsByStatus: { status: string; _count: number }[];
  totalEstimatedValue: number;
  recentActivities: { id: string; type: string; description: string; entityType: string; createdAt: string; user: { name: string } }[];
}

// Datos de tendencias mensuales (simulados)
const tendencias = [
  { mes: 'Nov', leads: 3, ingresos: 8000,  proyectos: 1 },
  { mes: 'Dic', leads: 5, ingresos: 12000, proyectos: 2 },
  { mes: 'Ene', leads: 4, ingresos: 15000, proyectos: 2 },
  { mes: 'Feb', leads: 7, ingresos: 18500, proyectos: 3 },
  { mes: 'Mar', leads: 6, ingresos: 22000, proyectos: 3 },
  { mes: 'Abr', leads: 9, ingresos: 27000, proyectos: 4 },
];

const maxLeads    = Math.max(...tendencias.map(t => t.leads));
const maxIngresos = Math.max(...tendencias.map(t => t.ingresos));

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<'ingresos' | 'leads' | 'proyectos'>('ingresos');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Resumen general de ArchiTechIA</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Leads', value: data?.counts.leads ?? 0, sub: `Valor: $${(data?.totalEstimatedValue ?? 0).toLocaleString()}`, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Propuestas',  value: data?.counts.proposals ?? 0, sub: 'En seguimiento activo', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Proyectos',   value: data?.counts.projects ?? 0, sub: 'En desarrollo y completados', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
          { label: 'Actividades', value: data?.counts.activities ?? 0, sub: 'Registradas en el sistema', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((k) => (
          <div key={k.label} className="bg-gray-900 rounded-xl shadow-lg p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{k.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{k.value}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={k.icon} />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-3">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfica de tendencias mensuales */}
      <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">Tendencias Mensuales</h3>
            <p className="text-xs text-gray-500">Últimos 6 meses</p>
          </div>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {(['ingresos', 'leads', 'proyectos'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setChartTab(t)}
                className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${chartTab === t ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Área chart manual */}
        <div className="flex items-end gap-3 h-40">
          {tendencias.map((t, i) => {
            let val = 0, max = 1;
            if (chartTab === 'ingresos') { val = t.ingresos; max = maxIngresos; }
            if (chartTab === 'leads')    { val = t.leads;    max = maxLeads; }
            if (chartTab === 'proyectos'){ val = t.proyectos; max = 5; }
            const h = Math.round((val / max) * 128);
            return (
              <div key={t.mes} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-orange-600 to-orange-400 group-hover:from-orange-500 group-hover:to-orange-300 transition-all"
                    style={{ height: `${h}px` }}
                  />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border border-gray-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap">
                    {chartTab === 'ingresos' ? `$${val.toLocaleString()}` : val}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{t.mes}</span>
              </div>
            );
          })}
        </div>

        {/* Línea de valores */}
        <div className="mt-4 pt-3 border-t border-gray-800 grid grid-cols-6 gap-3">
          {tendencias.map((t) => (
            <div key={t.mes} className="text-center">
              <p className="text-xs font-semibold text-orange-400">
                {chartTab === 'ingresos' ? `$${(t.ingresos / 1000).toFixed(0)}k` : chartTab === 'leads' ? t.leads : t.proyectos}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Estado breakdown + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Leads por Estado</h3>
          <div className="space-y-3">
            {data?.leadsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{translateStatus(item.status)}</span>
                <span className="font-semibold text-orange-400">{item._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Propuestas por Estado</h3>
          <div className="space-y-3">
            {data?.proposalsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{translateStatus(item.status)}</span>
                <span className="font-semibold text-orange-400">{item._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Proyectos por Estado</h3>
          <div className="space-y-3">
            {data?.projectsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{translateStatus(item.status)}</span>
                <span className="font-semibold text-orange-400">{item._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
        <div className="space-y-4">
          {data?.recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-800">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-orange-500">{activity.user.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">{activity.user.name}</span> {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
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
