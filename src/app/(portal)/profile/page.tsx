'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ProfileData {
  user: { id: string; name: string; email: string; role: string; avatar: string | null; createdAt: string };
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
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Edit profile form ──
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Change password form ──
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [changing, setChanging] = useState(false);

  const fetchProfile = () => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setEditName(d.user?.name || '');
        setEditEmail(d.user?.email || '');
        setEditAvatar(d.user?.avatar || '');
        setLoading(false);
      });
  };

  useEffect(() => { fetchProfile(); }, []);

  const openEdit = () => {
    if (profile?.user) {
      setEditName(profile.user.name);
      setEditEmail(profile.user.email);
      setEditAvatar(profile.user.avatar || '');
    }
    setEditError('');
    setEditSuccess('');
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setEditError('');
    setEditSuccess('');

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateProfile', name: editName, email: editEmail, avatar: editAvatar }),
    });

    const data = await res.json();

    if (!res.ok) {
      setEditError(data.error || 'Error al guardar');
    } else {
      setEditSuccess('Perfil actualizado correctamente');
      setEditing(false);
      updateSession();
      fetchProfile();
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess('');

    if (newPassword !== confirmPassword) {
      setPwError('Las contraseñas nuevas no coinciden');
      return;
    }

    setChanging(true);
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'changePassword', currentPassword, newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      setPwError(data.error || 'Error al cambiar contraseña');
    } else {
      setPwSuccess('Contraseña cambiada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangingPassword(false);
    }
    setChanging(false);
  };

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

      {/* ── Perfil card ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 flex items-center gap-6">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border-2 border-orange-500/30"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-black text-black">{initials}</span>
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-gray-400 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${role.cls}`}>{role.label}</span>
            <span className="text-xs text-gray-500">Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* ── Editar perfil + Cambiar contraseña ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* ── Editar Perfil ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Editar Perfil</h3>
            {!editing && (
              <button onClick={openEdit} className="text-xs text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Avatar (URL de imagen)</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={e => setEditAvatar(e.target.value)}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                {editAvatar && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={editAvatar} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-xs text-gray-500">Vista previa</span>
                  </div>
                )}
              </div>

              {editError && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-800 text-red-400 text-xs px-3 py-2 rounded-lg">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="flex items-center gap-2 bg-green-900/20 border border-green-800 text-green-400 text-xs px-3 py-2 rounded-lg">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : 'Guardar cambios'}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditError(''); }}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 text-sm rounded-lg hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre</span>
                <span className="text-gray-200">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-200">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avatar</span>
                <span className="text-gray-400 text-xs max-w-[180px] truncate">{user.avatar || 'No configurado'}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Cambiar Contraseña ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Cambiar Contraseña</h3>
            {!changingPassword && (
              <button onClick={() => setChangingPassword(true)} className="text-xs text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Cambiar
              </button>
            )}
          </div>

          {changingPassword ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Contraseña actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {pwError && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-800 text-red-400 text-xs px-3 py-2 rounded-lg">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 bg-green-900/20 border border-green-800 text-green-400 text-xs px-3 py-2 rounded-lg">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {pwSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleChangePassword}
                  disabled={changing}
                  className="flex-1 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {changing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cambiando...
                    </>
                  ) : 'Cambiar contraseña'}
                </button>
                <button
                  onClick={() => { setChangingPassword(false); setPwError(''); }}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 text-sm rounded-lg hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Contraseña</span>
                <span className="text-gray-400">••••••••</span>
              </div>
              <p className="text-xs text-gray-600">La contraseña se almacena encriptada con bcrypt.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
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

      {/* ── Actividad reciente ── */}
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
