'use client';

import { useEffect, useState } from 'react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  amount: number;
  sentDate: string | null;
  acceptedDate: string | null;
  createdAt: string;
  lead: { id: string; companyName: string; contactName: string } | null;
  user: { id: string; name: string; email: string };
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [leads, setLeads] = useState<{ id: string; companyName: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'DRAFT',
    amount: '',
    leadId: '',
    userId: '',
    sentDate: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/proposals').then(res => res.json()),
      fetch('/api/leads').then(res => res.json()),
      fetch('/api/users').then(res => res.json()),
    ]).then(([proposalsData, leadsData, usersData]) => {
      setProposals(proposalsData);
      setLeads(leadsData);
      setUsers(usersData);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const newProposal = await res.json();
      setProposals([newProposal, ...proposals]);
      setShowModal(false);
      setFormData({ title: '', description: '', status: 'DRAFT', amount: '', leadId: '', userId: '', sentDate: '' });
    }
  };

  const filteredProposals = proposals.filter(p =>
    p.title.toLowerCase().includes(filter.toLowerCase()) ||
    p.lead?.companyName.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-800 text-gray-400',
      SENT: 'bg-orange-500/20 text-orange-400',
      UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400',
      ACCEPTED: 'bg-green-500/20 text-green-400',
      REJECTED: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-800 text-gray-400';
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Propuestas</h1>
          <p className="text-gray-400 mt-1">Gestión de propuestas comerciales</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          + Nueva Propuesta
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl shadow border border-gray-800 mb-6">
        <div className="p-4 border-b border-gray-800">
          <input type="text" placeholder="Buscar por título o cliente..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha Envío</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Responsable</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {filteredProposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{proposal.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{proposal.lead?.companyName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal.status)}`}>
                      {translateStatus(proposal.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">${proposal.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{proposal.sentDate ? new Date(proposal.sentDate).toLocaleDateString('es-ES') : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{proposal.user.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Nueva Propuesta</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Título</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white">
                    <option value="DRAFT">Borrador</option>
                    <option value="SENT">Enviado</option>
                    <option value="UNDER_REVIEW">En Revisión</option>
                    <option value="ACCEPTED">Aceptado</option>
                    <option value="REJECTED">Rechazado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Monto</label>
                  <input type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Envío</label>
                  <input type="date" value={formData.sentDate} onChange={(e) => setFormData({...formData, sentDate: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Lead Asociado</label>
                  <select value={formData.leadId} onChange={(e) => setFormData({...formData, leadId: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white">
                    <option value="">Seleccionar...</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Responsable</label>
                  <select required value={formData.userId} onChange={(e) => setFormData({...formData, userId: e.target.value})} className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white">
                    <option value="">Seleccionar...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800/50 text-gray-300">Cancelar</button>
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
    DRAFT: 'Borrador', SENT: 'Enviado', UNDER_REVIEW: 'En Revisión',
    ACCEPTED: 'Aceptado', REJECTED: 'Rechazado',
  };
  return translations[status] || status;
}
