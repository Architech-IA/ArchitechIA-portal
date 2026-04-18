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

export default function TraceabilityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');

  useEffect(() => {
    fetch('/api/activities')
      .then(res => res.json())
      .then(data => {
        setActivities(data);
        setLoading(false);
      });
  }, []);

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.description.toLowerCase().includes(filter.toLowerCase()) ||
      a.user.name.toLowerCase().includes(filter.toLowerCase());
    const matchesType = !entityTypeFilter || a.entityType === entityTypeFilter;
    return matchesSearch && matchesType;
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

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

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
          <p className="text-gray-400 mt-1">Historial completo de actividades y cambios</p>
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

      {/* Filters */}
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

      {/* Activity Timeline */}
      <div className="bg-gray-800 rounded-xl shadow border border-gray-700">
        <div className="p-6">
          <div className="space-y-6">
            {filteredActivities.map((activity, index) => (
              <div key={activity.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-orange-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  </div>
                  {index < filteredActivities.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-600 mt-2"></div>
                  )}
                </div>

                {/* Content */}
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
          </div>
        </div>
      </div>
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
