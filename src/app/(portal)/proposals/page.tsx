'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Proposal {
  id: string; title: string; description: string; status: string;
  amount: number; sentDate: string | null; createdAt: string;
  lead: { id: string; companyName: string; contactName: string } | null;
  user: { id: string; name: string; email: string };
}

interface Lead { id: string; companyName: string; contactName: string; }
interface User { id: string; name: string; email: string; }

const STATUS_OPTIONS = [
  { value: 'DRAFT',        label: 'Borrador',     cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  { value: 'SENT',         label: 'Enviado',      cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'UNDER_REVIEW', label: 'En Revisión',  cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'ACCEPTED',     label: 'Aceptado',     cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'REJECTED',     label: 'Rechazado',    cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

function statusCls(s: string) {
  return STATUS_OPTIONS.find(o => o.value === s)?.cls ?? 'bg-gray-700 text-gray-400';
}
function statusLabel(s: string) {
  return STATUS_OPTIONS.find(o => o.value === s)?.label ?? s;
}

export default function ProposalsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', status: 'DRAFT',
    amount: '', leadId: '', userId: '', sentDate: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/proposals').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([p, l, u]) => {
      setProposals(Array.isArray(p) ? p : []);
      setLeads(Array.isArray(l) ? l : []);
      setUsers(Array.isArray(u) ? u : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return proposals.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.title.toLowerCase().includes(q) || (p.lead?.companyName ?? '').toLowerCase().includes(q);
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [proposals, search, filterStatus]);

  const kpis = useMemo(() => {
    const total    = proposals.length;
    const aceptadas = proposals.filter(p => p.status === 'ACCEPTED').length;
    const pendiente = proposals.filter(p => ['SENT', 'UNDER_REVIEW'].includes(p.status)).reduce((s, p) => s + p.amount, 0);
    const valorTotal = proposals.filter(p => p.status === 'ACCEPTED').reduce((s, p) => s + p.amount, 0);
    return { total, aceptadas, pendiente, valorTotal };
  }, [proposals]);

  const openModal = () => {
    setForm({ title: '', description: '', status: 'DRAFT', amount: '', leadId: '', userId: session?.user?.id ?? '', sentDate: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0, userId: form.userId || session?.user?.id }),
    });
    if (res.ok) {
      const created = await res.json();
      setProposals(prev => [created, ...prev]);
      setShowModal(false);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Propuestas</h1>
          <p className="text-gray-400 mt-1">Gestión de propuestas comerciales</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva propuesta
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',         value: kpis.total,                              color: 'text-white' },
          { label: 'Aceptadas',     value: kpis.aceptadas,                          color: 'text-green-400' },
          { label: 'Valor aceptado', value: `$${kpis.valorTotal.toLocaleString()}`, color: 'text-orange-400' },
          { label: 'En seguimiento', value: `$${kpis.pendiente.toLocaleString()}`,  color: 'text-yellow-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-orange-500/20 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Buscar por título o empresa..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Lista / Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          {proposals.length === 0 ? (
            <>
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-orange-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Aún no hay propuestas</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs">Crea tu primera propuesta comercial y empieza a hacer seguimiento de tus oportunidades.</p>
              <button onClick={openModal} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors">
                Crear primera propuesta
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Sin resultados</h3>
              <p className="text-gray-500 text-sm">Intenta con otros filtros o términos de búsqueda.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => router.push(`/proposals/${p.id}`)}
              className="bg-gray-900 border border-gray-800 hover:border-orange-500/40 rounded-xl p-5 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-medium truncate group-hover:text-orange-300 transition-colors">{p.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${statusCls(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    {p.lead && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                        </svg>
                        {p.lead.companyName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {p.user.name}
                    </span>
                    <span>{new Date(p.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-1">{p.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-orange-400">${p.amount.toLocaleString()}</p>
                  {p.sentDate && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Enviado {new Date(p.sentDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva propuesta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold">Nueva propuesta</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Título *</label>
                <input
                  type="text" placeholder="Nombre de la propuesta"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none placeholder-gray-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Estado</label>
                  <select
                    value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Monto (USD)</label>
                  <input
                    type="number" placeholder="0"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none placeholder-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Lead asociado</label>
                <select
                  value={form.leadId} onChange={e => setForm(f => ({ ...f, leadId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">Sin lead asociado</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.companyName} — {l.contactName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Responsable</label>
                <select
                  value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">— Seleccionar —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Descripción</label>
                <textarea
                  placeholder="Descripción breve de la propuesta..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none placeholder-gray-600 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave} disabled={saving || !form.title.trim()}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Guardando...' : 'Crear propuesta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
