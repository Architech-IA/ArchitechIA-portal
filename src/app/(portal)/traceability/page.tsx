'use client';

import { useEffect, useState } from 'react';

interface Activity {
  id: string;
  type: string;
  description: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface SessionLog {
  id: string;
  userId: string | null;
  email: string | null;
  action: string;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  details: string | null;
  createdAt: string;
}

type Tab = 'activities' | 'sessions';

const TABS: { key: Tab; label: string }[] = [
  { key: 'activities', label: 'Actividades' },
  { key: 'sessions', label: 'Sesiones' },
];

export default function TraceabilityPage() {
  const [tab, setTab] = useState<Tab>('activities');

  // ── Activities state ──
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [filter, setFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');

  // ── Sessions state ──
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsFetched, setSessionsFetched] = useState(false);
  const [sessionActionFilter, setSessionActionFilter] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');

  useEffect(() => {
    fetch('/api/activities')
      .then(res => res.json())
      .then(data => {
        setActivities(data);
        setLoadingActivities(false);
      });
  }, []);

  useEffect(() => {
    if (tab === 'sessions' && !sessionsFetched) {
      setLoadingSessions(true);
      fetch('/api/sessions?limit=200')
        .then(res => res.json())
        .then(data => {
          setSessions(data);
          setLoadingSessions(false);
          setSessionsFetched(true);
        });
    }
  }, [tab, sessionsFetched]);

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.description.toLowerCase().includes(filter.toLowerCase()) ||
      a.user.name.toLowerCase().includes(filter.toLowerCase());
    const matchesType = !entityTypeFilter || a.entityType === entityTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredSessions = sessions.filter(s => {
    const matchesAction = !sessionActionFilter || s.action === sessionActionFilter;
    const matchesSearch = !sessionSearch ||
      (s.email && s.email.toLowerCase().includes(sessionSearch.toLowerCase())) ||
      (s.ip && s.ip.includes(sessionSearch)) ||
      (s.action && s.action.toLowerCase().includes(sessionSearch.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      CREATED: '➕',
      UPDATED: '✏️',
      STATUS_CHANGED: '🔄',
      NOTE_ADDED: '📝',
      PROPOSAL_SENT: '📤',
      MILESTONE_COMPLETED: '✅',
    };
    return icons[type] || '📌';
  };

  const getEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      lead: 'Lead',
      proposal: 'Propuesta',
      project: 'Proyecto',
    };
    return labels[entityType] || entityType;
  };

  const getActionBadge = (action: string) => {
    const map: Record<string, string> = {
      LOGIN: 'bg-green-900 text-green-300',
      LOGOUT: 'bg-gray-700 text-gray-300',
      FAILED_LOGIN: 'bg-red-900 text-red-300',
    };
    return map[action] || 'bg-gray-700 text-gray-300';
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      LOGIN: 'Inicio de sesión',
      LOGOUT: 'Cierre de sesión',
      FAILED_LOGIN: 'Intento fallido',
    };
    return map[action] || action;
  };

  const handleExportPDF = () => {
    window.print();
  };

  const parseBrowser = (ua: string | null) => {
    if (!ua) return '—';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Chrome/') && !ua.includes('Edg/') && !ua.includes('OPR/')) return 'Chrome';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
    return 'Navegador';
  };

  const parseOS = (ua: string | null) => {
    if (!ua) return '—';
    if (ua.includes('Windows NT')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return '—';
  };

  if (tab === 'activities' && loadingActivities) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="p-8">
      <style>{`
        @media print {
          aside, nav, button, input, select, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { background: white !important; border: 1px solid #ddd !important; }
          .print-text { color: black !important; }
        }
      `}</style>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Trazabilidad y Control</h1>
          <p className="text-gray-400 mt-1">Historial completo de actividades, sesiones y cambios</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="no-print flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-xl p-1 border border-gray-700 w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === key
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════ TAB: ACTIVITIES ═══════════ */}
      {tab === 'activities' && (
        <>
          <div className="bg-gray-800 rounded-xl shadow p-4 border border-gray-700 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Buscar actividades..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-orange-500"
              />
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Todos los tipos</option>
                <option value="lead">Leads</option>
                <option value="proposal">Propuestas</option>
                <option value="project">Proyectos</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow border border-gray-700">
            <div className="p-6">
              <div className="space-y-6">
                {filteredActivities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-orange-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      </div>
                      {index < filteredActivities.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-600 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-100">{activity.user.name}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getEntityTypeBadgeColor(activity.entityType)}`}>
                              {getEntityTypeLabel(activity.entityType)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleString('es-ES')}
                          </span>
                        </div>
                        <p className="text-gray-300">{activity.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredActivities.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No se encontraron actividades</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ TAB: SESSIONS ═══════════ */}
      {tab === 'sessions' && (
        <>
          {loadingSessions ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              <div className="bg-gray-800 rounded-xl shadow p-4 border border-gray-700 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Buscar por email, IP o acción..."
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-orange-500"
                  />
                  <select
                    value={sessionActionFilter}
                    onChange={(e) => setSessionActionFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Todas las acciones</option>
                    <option value="LOGIN">Inicios de sesión</option>
                    <option value="LOGOUT">Cierres de sesión</option>
                    <option value="FAILED_LOGIN">Intentos fallidos</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl shadow border border-gray-700 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="px-5 py-3 font-medium">Fecha / Hora</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Acción</th>
                      <th className="px-5 py-3 font-medium">IP</th>
                      <th className="px-5 py-3 font-medium">Navegador</th>
                      <th className="px-5 py-3 font-medium">SO</th>
                      <th className="px-5 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((s) => (
                      <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-750 transition-colors">
                        <td className="px-5 py-3 text-gray-200 whitespace-nowrap font-mono text-xs">
                          {new Date(s.createdAt).toLocaleString('es-ES')}
                        </td>
                        <td className="px-5 py-3 text-gray-300 max-w-[200px] truncate" title={s.email || '—'}>
                          {s.email || '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getActionBadge(s.action)}`}>
                            {getActionLabel(s.action)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 font-mono text-xs">{s.ip || '—'}</td>
                        <td className="px-5 py-3 text-gray-400">{parseBrowser(s.userAgent)}</td>
                        <td className="px-5 py-3 text-gray-400">{parseOS(s.userAgent)}</td>
                        <td className="px-5 py-3">
                          {s.success ? (
                            <span className="text-green-400 text-xs font-medium">✓ Éxito</span>
                          ) : (
                            <span className="text-red-400 text-xs font-medium" title={s.details || ''}>
                              ✗ Fallo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSessions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                          No se encontraron registros de sesiones
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-600 mt-3 text-right">
                Mostrando {filteredSessions.length} de {sessions.length} registros
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function getEntityTypeBadgeColor(entityType: string): string {
  const colors: Record<string, string> = {
    lead: 'bg-orange-900 text-orange-300',
    proposal: 'bg-purple-900 text-purple-300',
    project: 'bg-green-900 text-green-300',
  };
  return colors[entityType] || 'bg-gray-700 text-gray-300';
}
