'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ProjectMember {
  user: { id: string; name: string; email: string };
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  users: ProjectMember[];
  milestones: { id: string; name: string; status: string; dueDate: string | null }[];
}

const EMPTY_FORM = {
  name: '', description: '', status: 'PLANNING', priority: 'MEDIUM',
  progress: '0', startDate: '', endDate: '', userId: '',
};

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PLANNING:    'bg-orange-900/30 text-orange-300',
    IN_PROGRESS: 'bg-green-900/30 text-green-300',
    ON_HOLD:     'bg-yellow-900/30 text-yellow-300',
    COMPLETED:   'bg-gray-800 text-gray-300',
    CANCELLED:   'bg-red-900/30 text-red-300',
  };
  return colors[status] || 'bg-gray-800 text-gray-300';
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    LOW:      'bg-gray-800 text-gray-300',
    MEDIUM:   'bg-yellow-900/30 text-yellow-300',
    HIGH:     'bg-orange-900/30 text-orange-300',
    CRITICAL: 'bg-red-900/30 text-red-300',
  };
  return colors[priority] || 'bg-gray-800 text-gray-300';
}

function translateStatus(s: string) {
  return ({ PLANNING: 'Planificación', IN_PROGRESS: 'En Progreso', ON_HOLD: 'En Pausa', COMPLETED: 'Completado', CANCELLED: 'Cancelado' } as Record<string, string>)[s] || s;
}

function translatePriority(p: string) {
  return ({ LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica' } as Record<string, string>)[p] || p;
}

function translateRole(r: string) {
  return ({ OWNER: 'Propietario', PARTNER: 'Colaborador', VIEWER: 'Observador' } as Record<string, string>)[r] || r;
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';

  const [projects, setProjects]       = useState<Project[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [confirmDel, setConfirmDel]   = useState<Project | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [filter, setFilter]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers]             = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([p, u]) => { setProjects(p); setUsers(u); setLoading(false); });
  }, []);

  const openNew = () => {
    setEditProject(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setFormError('');
    setFormData({
      name:        p.name,
      description: p.description,
      status:      p.status,
      priority:    p.priority,
      progress:    String(p.progress),
      startDate:   p.startDate ? p.startDate.split('T')[0] : '',
      endDate:     p.endDate ? p.endDate.split('T')[0] : '',
      userId:      p.users.find(u => u.role === 'OWNER')?.user.id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const url    = editProject ? `/api/projects/${editProject.id}` : '/api/projects';
      const method = editProject ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const saved = await res.json();
        setProjects(prev => editProject
          ? prev.map(p => p.id === saved.id ? saved : p)
          : [saved, ...prev]);
        setShowModal(false);
      } else {
        const d = await res.json();
        setFormError(d.error || `Error ${res.status}`);
      }
    } catch {
      setFormError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${confirmDel.id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== confirmDel.id));
        setConfirmDel(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(filter.toLowerCase()) || p.description.toLowerCase().includes(filter.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = ['PLANNING','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED'].reduce((acc, s) => {
    acc[s] = projects.filter(p => p.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Proyectos</h1>
          <p className="text-gray-400 mt-1">Desarrollo de productos y proyectos</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          + Nuevo Proyecto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',          value: projects.length,               color: 'text-white' },
          { label: 'Planificación',  value: statusCounts.PLANNING || 0,    color: 'text-orange-400' },
          { label: 'En Progreso',    value: statusCounts.IN_PROGRESS || 0, color: 'text-green-400' },
          { label: 'En Pausa',       value: statusCounts.ON_HOLD || 0,     color: 'text-yellow-400' },
          { label: 'Completados',    value: statusCounts.COMPLETED || 0,   color: 'text-blue-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-gray-900 rounded-xl shadow border border-gray-800 mb-6 p-4 flex gap-3 flex-wrap items-center">
        <input
          type="text"
          placeholder="Buscar proyectos..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white"
        />
        {[
          { value: '',           label: 'Todos' },
          { value: 'PLANNING',   label: 'Planificación' },
          { value: 'IN_PROGRESS', label: 'En Progreso' },
          { value: 'ON_HOLD',    label: 'En Pausa' },
          { value: 'COMPLETED',  label: 'Completado' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${statusFilter === opt.value ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-6">
        {filtered.map(project => (
          <div key={project.id} className="border border-gray-700 rounded-xl p-6 bg-gray-900 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                <p className="text-gray-400 mt-1">{project.description}</p>
              </div>
              <div className="flex gap-2 items-start ml-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                  {translateStatus(project.status)}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(project.priority)}`}>
                  {translatePriority(project.priority)}
                </span>
                {isAdmin && (
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => openEdit(project)}
                      className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmDel(project)}
                      className="px-3 py-1 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-400">Progreso</span>
                <span className="font-semibold text-white">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Miembros</p>
                <div className="flex flex-wrap gap-1">
                  {project.users.map(m => (
                    <span
                      key={m.user.id}
                      title={`${m.user.name} · ${translateRole(m.role)}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300"
                    >
                      {m.user.name.split(' ')[0]}
                      {m.role === 'OWNER' && <span className="text-orange-400">★</span>}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-500">Fecha Inicio</p>
                <p className="font-medium text-white">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString('es-ES') : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Fecha Fin</p>
                <p className="font-medium text-white">
                  {project.endDate ? new Date(project.endDate).toLocaleDateString('es-ES') : '-'}
                </p>
              </div>
            </div>

            {project.milestones.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm font-medium text-gray-300 mb-2">Hitos ({project.milestones.length})</p>
                <div className="flex flex-wrap gap-2">
                  {project.milestones.slice(0, 3).map(m => (
                    <span key={m.id} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">{m.name}</span>
                  ))}
                  {project.milestones.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-800 text-gray-500 rounded">+{project.milestones.length - 3} más</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            No hay proyectos que coincidan con los filtros.
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{editProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white">
                    <option value="PLANNING">Planificación</option>
                    <option value="IN_PROGRESS">En Progreso</option>
                    <option value="ON_HOLD">En Pausa</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Prioridad</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white">
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Progreso: {formData.progress}%</label>
                  <input
                    type="range" min="0" max="100"
                    value={formData.progress}
                    onChange={e => setFormData({...formData, progress: e.target.value})}
                    className="w-full accent-orange-500 mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Inicio</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Fin</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
              </div>
              {!editProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Propietario (Owner)</label>
                  <select required value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white">
                    <option value="">Seleccionar...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}
              {formError && (
                <div className="px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">{formError}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60 flex items-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editProject ? 'Guardar Cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Eliminar proyecto</h3>
                <p className="text-gray-400 text-sm">¿Seguro que deseas eliminar <span className="text-white font-medium">{confirmDel.name}</span>? Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
                {deleting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
