'use client';

import { useEffect, useState } from 'react';

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    progress: '0',
    startDate: '',
    endDate: '',
    userId: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(res => res.json()),
      fetch('/api/users').then(res => res.json()),
    ]).then(([projectsData, usersData]) => {
      setProjects(projectsData);
      setUsers(usersData);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const newProject = await res.json();
      setProjects([newProject, ...projects]);
      setShowModal(false);
      setFormData({ name: '', description: '', status: 'PLANNING', priority: 'MEDIUM', progress: '0', startDate: '', endDate: '', userId: '' });
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.description.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-orange-900/30 text-orange-300',
      IN_PROGRESS: 'bg-green-900/30 text-green-300',
      ON_HOLD: 'bg-yellow-900/30 text-yellow-300',
      COMPLETED: 'bg-gray-800 text-gray-300',
      CANCELLED: 'bg-red-900/30 text-red-300',
    };
    return colors[status] || 'bg-gray-800 text-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-800 text-gray-300',
      MEDIUM: 'bg-yellow-900/30 text-yellow-300',
      HIGH: 'bg-orange-900/30 text-orange-300',
      CRITICAL: 'bg-red-900/30 text-red-300',
    };
    return colors[priority] || 'bg-gray-800 text-gray-300';
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Proyectos</h1>
          <p className="text-gray-400 mt-1">Desarrollo de productos y proyectos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          + Nuevo Proyecto
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl shadow border border-gray-700 mb-6">
        <div className="p-4 border-b border-gray-700">
          <input type="text" placeholder="Buscar proyectos..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400" />
        </div>
        <div className="grid gap-6 p-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="border border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow bg-gray-800">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-100">{project.name}</h3>
                  <p className="text-gray-400 mt-1">{project.description}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {translateStatus(project.status)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(project.priority)}`}>
                    {translatePriority(project.priority)}
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Progreso</span>
                  <span className="font-semibold text-gray-100">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Miembros</p>
                  <div className="flex flex-wrap gap-1">
                    {project.users.map((m) => (
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
                  <p className="font-medium text-gray-100">{project.startDate ? new Date(project.startDate).toLocaleDateString('es-ES') : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fecha Fin</p>
                  <p className="font-medium text-gray-100">{project.endDate ? new Date(project.endDate).toLocaleDateString('es-ES') : '-'}</p>
                </div>
              </div>
              {project.milestones.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-sm font-medium text-gray-300 mb-2">Hitos ({project.milestones.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {project.milestones.slice(0, 3).map(m => (
                      <span key={m.id} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">{m.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-100">Nuevo Proyecto</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100">
                    <option value="PLANNING">Planificación</option>
                    <option value="IN_PROGRESS">En Progreso</option>
                    <option value="ON_HOLD">En Pausa</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Prioridad</label>
                  <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100">
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Progreso (%)</label>
                  <input type="number" min="0" max="100" value={formData.progress} onChange={(e) => setFormData({...formData, progress: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Inicio</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Fin</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Propietario (Owner)</label>
                <select required value={formData.userId} onChange={(e) => setFormData({...formData, userId: e.target.value})} className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100">
                  <option value="">Seleccionar...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    PLANNING: 'Planificación', IN_PROGRESS: 'En Progreso', ON_HOLD: 'En Pausa',
    COMPLETED: 'Completado', CANCELLED: 'Cancelado',
  };
  return translations[status] || status;
}

function translatePriority(priority: string): string {
  const translations: Record<string, string> = {
    LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica',
  };
  return translations[priority] || priority;
}

function translateRole(role: string): string {
  const translations: Record<string, string> = {
    OWNER: 'Propietario', PARTNER: 'Colaborador', VIEWER: 'Observador',
  };
  return translations[role] || role;
}
