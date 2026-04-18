'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ProfileData {
  user: { id: string; name: string; email: string; role: string; createdAt: string };
  stats: { leads: number; proposals: number; projects: number; pipelineValue: number; leadsGanados: number };
  recentActivity: { id: string; type: string; description: string; entityType: string; createdAt: string }[];
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  ADMIN:        { label: 'Admin',        cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  PARTNER:      { label: 'Socio',        cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  COLLABORATOR: { label: 'Colaborador',  cls: 'bg-gray-700 text-gray-400 border-gray-600' },
};

const ACTIVITY_ICONS: Record<string, string> = {
  CREATED: '➕', UPDATED: '✏️', STATUS_CHANGED: '🔄',
  NOTE_ADDED: '📝', PROPOSAL_SENT: '📤', MILESTONE_COMPLETED: '✅',
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { setProfile(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  if (!profile?.user) return null;

  const { user, stats, recentActivity } = profile;
  const role = ROLE_LABELS[user.role] || ROLE_LABELS.COLLABORATOR;
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const tasaConversion = stats.leads > 0 ? Math.round((stats.leadsGanados / stats.leads) * 100) : 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Mi Perfil</h1>

      {/* Perfil card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl font-black text-black">{initials}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-gray-400 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${role.cls}`}>{role.label}</span>
            <span className="text-xs text-gray-500">Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Leads',          value: stats.leads,                                  color: 'text-white' },
          { label: 'Propuestas',     value: stats.proposals,                               color: 'text-blue-400' },
          { label: 'Proyectos',      value: stats.projects,                                color: 'text-green-400' },
          { label: 'Pipeline',       value: `$${stats.pipelineValue.toLocaleString()}`,    color: 'text-orange-400' },
          { label: 'Tasa Conv.',     value: `${tasaConversion}%`,                          color: 'text-purple-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">Mi Actividad Reciente</h3>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin actividad registrada aún.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-800">
                <span className="text-lg flex-shrink-0">{ACTIVITY_ICONS[a.type] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{a.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleString('es-ES')} ·{' '}
                    <span className="text-orange-500 capitalize">{a.entityType}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
