'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PipelineView from '@/components/PipelineView';

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  status: string;
  source: string;
  estimatedValue: number;
  notes: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const EMPTY_FORM = {
  companyName: '', contactName: '', email: '', phone: '',
  status: 'NEW', source: '', estimatedValue: '', notes: '', userId: '',
};

const STATUS_COLORS: Record<string, string> = {
  NEW:             'bg-gray-500/20 text-gray-400',
  CONTACTED:       'bg-blue-500/20 text-blue-400',
  DIAGNOSIS:       'bg-cyan-500/20 text-cyan-400',
  QUALIFIED:       'bg-yellow-500/20 text-yellow-400',
  DEMO_VALIDATION: 'bg-purple-500/20 text-purple-400',
  PROPOSAL_SENT:   'bg-indigo-500/20 text-indigo-400',
  NEGOTIATION:     'bg-orange-500/20 text-orange-400',
  WON:             'bg-green-500/20 text-green-400',
  LOST:            'bg-red-500/20 text-red-400',
};

function translateStatus(status: string) {
  const t: Record<string, string> = {
    NEW:             'Nuevo',
    CONTACTED:       'Contactado',
    DIAGNOSIS:       'Diagnóstico',
    QUALIFIED:       'Calificado',
    DEMO_VALIDATION: 'Demo / Validación',
    PROPOSAL_SENT:   'Propuesta Enviada',
    NEGOTIATION:     'Negociación',
    WON:             'Ganado',
    LOST:            'Perdido',
  };
  return t[status] || status;
}

export default function LeadsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';

  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead]   = useState<Lead | null>(null);
  const [confirmDel, setConfirmDel] = useState<Lead | null>(null);
  const [users, setUsers]         = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting]   = useState(false);
  const [delError, setDelError]   = useState('');
  const [notesLead, setNotesLead]     = useState<Lead | null>(null);
  const [notesList, setNotesList]     = useState<{ id: string; description: string; createdAt: string; user: { name: string } }[]>([]);
  const [noteText, setNoteText]       = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [addingNote, setAddingNote]   = useState(false);
  const [activeTab, setActiveTab]     = useState<'lista' | 'pipeline'>('lista');

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([l, u]) => { setLeads(l); setUsers(u); setLoading(false); });
  }, []);

  const openNew = () => {
    setEditLead(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (lead: Lead) => {
    setEditLead(lead);
    setFormError('');
    setFormData({
      companyName:    lead.companyName,
      contactName:    lead.contactName,
      email:          lead.email,
      phone:          lead.phone || '',
      status:         lead.status,
      source:         lead.source,
      estimatedValue: String(lead.estimatedValue),
      notes:          lead.notes || '',
      userId:         lead.user.id,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editLead) {
        const res = await fetch(`/api/leads/${editLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setLeads(leads.map(l => l.id === updated.id ? updated : l));
          setShowModal(false);
        } else {
          const data = await res.json();
          setFormError(data.error || `Error ${res.status}`);
        }
      } else {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const newLead = await res.json();
          setLeads([newLead, ...leads]);
          setShowModal(false);
        } else {
          const data = await res.json();
          setFormError(data.error || `Error ${res.status}`);
        }
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
    setDelError('');
    try {
      const res = await fetch(`/api/leads/${confirmDel.id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads(leads.filter(l => l.id !== confirmDel.id));
        setConfirmDel(null);
      } else {
        const data = await res.json();
        setDelError(data.error || `Error ${res.status}`);
      }
    } catch {
      setDelError('Error de conexión. Intenta de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  const openNotes = async (lead: Lead) => {
    setNotesLead(lead);
    setNoteText('');
    setNotesLoading(true);
    const data = await fetch(`/api/leads/${lead.id}/notes`).then(r => r.json());
    setNotesList(data);
    setNotesLoading(false);
  };

  const addNote = async () => {
    if (!notesLead || !noteText.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/leads/${notesLead.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: noteText }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotesList(prev => [note, ...prev]);
      setNoteText('');
    }
    setAddingNote(false);
  };

  const exportCSV = () => {
    const headers = ['Empresa', 'Contacto', 'Email', 'Teléfono', 'Estado', 'Fuente', 'Valor Estimado', 'Responsable', 'Creado'];
    const rows = filtered.map(l => [
      l.companyName, l.contactName, l.email, l.phone ?? '', translateStatus(l.status),
      l.source, l.estimatedValue, l.user.name, new Date(l.createdAt).toLocaleDateString('es-ES'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads.filter(l =>
    l.companyName.toLowerCase().includes(filter.toLowerCase()) ||
    l.contactName.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  const totalPipeline   = leads.filter(l => l.status !== 'LOST').reduce((a, l) => a + l.estimatedValue, 0);
  const totalGanado     = leads.filter(l => l.status === 'WON').reduce((a, l) => a + l.estimatedValue, 0);
  const leadsGanados    = leads.filter(l => l.status === 'WON').length;
  const tasaConversion  = leads.length > 0 ? Math.round((leadsGanados / leads.length) * 100) : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 mt-1">Gestión de prospectos y oportunidades</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'lista' && (
            <button onClick={exportCSV} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
          )}
          <button onClick={openNew} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            + Nuevo Lead
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('lista')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'lista'
              ? 'bg-orange-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Lista
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pipeline'
              ? 'bg-orange-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Pipeline
        </button>
      </div>

      {activeTab === 'lista' ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Leads',      value: leads.length,                           color: 'text-white' },
              { label: 'Pipeline activo',  value: `$${totalPipeline.toLocaleString()}`,   color: 'text-orange-400' },
              { label: 'Valor ganado',     value: `$${totalGanado.toLocaleString()}`,     color: 'text-green-400' },
              { label: 'Tasa conversión',  value: `${tasaConversion}%`,                   color: 'text-blue-400' },
            ].map(k => (
              <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div className="bg-gray-900 rounded-xl shadow border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <input
                type="text"
                placeholder="Buscar por empresa o contacto..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Empresa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fuente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Responsable</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notas</th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {filtered.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{lead.companyName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{lead.contactName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[lead.status] || 'bg-gray-800 text-gray-400'}`}>
                          {translateStatus(lead.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${lead.estimatedValue.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{lead.source}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{lead.user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openNotes(lead)}
                          className="px-3 py-1 text-xs bg-blue-900/30 hover:bg-blue-800/50 text-blue-400 rounded-lg transition-colors"
                        >
                          Ver notas
                        </button>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(lead)}
                              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setConfirmDel(lead)}
                              className="px-3 py-1 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <PipelineView leads={leads} users={users} onLeadsChange={setLeads} />
      )}

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{editLead ? 'Editar Lead' : 'Nuevo Lead'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Empresa</label>
                  <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contacto</label>
                  <input type="text" required value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white">
                    <option value="NEW">Nuevo</option>
                    <option value="CONTACTED">Contactado</option>
                    <option value="DIAGNOSIS">Diagnóstico</option>
                    <option value="QUALIFIED">Calificado</option>
                    <option value="DEMO_VALIDATION">Demo / Validación</option>
                    <option value="PROPOSAL_SENT">Propuesta Enviada</option>
                    <option value="NEGOTIATION">Negociación</option>
                    <option value="WON">Ganado</option>
                    <option value="LOST">Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fuente</label>
                  <input type="text" required value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valor Estimado</label>
                  <input type="number" value={formData.estimatedValue} onChange={e => setFormData({...formData, estimatedValue: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Responsable</label>
                <select required value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white">
                  <option value="">Seleccionar...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
              </div>
              {formError && (
                <div className="px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                  {formError}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800/50 text-gray-300">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editLead ? 'Guardar Cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal notas */}
      {notesLead && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Notas — {notesLead.companyName}</h2>
              <button onClick={() => setNotesLead(null)} className="text-gray-400 hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Escribe una nota..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <button
                onClick={addNote}
                disabled={addingNote || !noteText.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
              >
                {addingNote ? '...' : 'Agregar'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {notesLoading && <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" /></div>}
              {!notesLoading && notesList.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">Sin notas aún. Agrega la primera.</p>
              )}
              {notesList.map(n => (
                <div key={n.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <p className="text-sm text-white">{n.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{n.user.name} · {new Date(n.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Eliminar lead</h3>
                <p className="text-gray-400 text-sm">¿Seguro que deseas eliminar <span className="text-white font-medium">{confirmDel.companyName}</span>? Esta acción no se puede deshacer.</p>
              </div>
            </div>
            {delError && (
              <div className="mb-3 px-3 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                {delError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setConfirmDel(null); setDelError(''); }} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">Cancelar</button>
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
