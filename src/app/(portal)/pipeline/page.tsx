'use client';

import { useState } from 'react';

type Etapa = 'Nuevo' | 'Contactado' | 'Calificado' | 'Propuesta' | 'Negociación' | 'Ganado' | 'Perdido';

interface Lead {
  id: string;
  empresa: string;
  contacto: string;
  valor: number;
  etapa: Etapa;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fecha: string;
}

const ETAPAS: Etapa[] = ['Nuevo', 'Contactado', 'Calificado', 'Propuesta', 'Negociación', 'Ganado', 'Perdido'];

const ETAPA_COLORS: Record<Etapa, string> = {
  Nuevo:       'border-blue-500/40 bg-blue-900/10',
  Contactado:  'border-purple-500/40 bg-purple-900/10',
  Calificado:  'border-yellow-500/40 bg-yellow-900/10',
  Propuesta:   'border-indigo-500/40 bg-indigo-900/10',
  Negociación: 'border-orange-500/40 bg-orange-900/10',
  Ganado:      'border-green-500/40 bg-green-900/10',
  Perdido:     'border-red-500/40 bg-red-900/10',
};

const ETAPA_HEADER: Record<Etapa, string> = {
  Nuevo:       'bg-blue-900/30 text-blue-300',
  Contactado:  'bg-purple-900/30 text-purple-300',
  Calificado:  'bg-yellow-900/30 text-yellow-300',
  Propuesta:   'bg-indigo-900/30 text-indigo-300',
  Negociación: 'bg-orange-900/30 text-orange-300',
  Ganado:      'bg-green-900/30 text-green-300',
  Perdido:     'bg-red-900/30 text-red-300',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  Alta:  'bg-red-900/30 text-red-400',
  Media: 'bg-yellow-900/30 text-yellow-400',
  Baja:  'bg-gray-700 text-gray-400',
};

const initialLeads: Lead[] = [
  { id: '1', empresa: 'TechCorp S.A.',      contacto: 'Carlos Méndez',   valor: 15000, etapa: 'Negociación', prioridad: 'Alta',  fecha: '2025-03-10' },
  { id: '2', empresa: 'Grupo NX',           contacto: 'Ana Rodríguez',   valor: 8500,  etapa: 'Propuesta',   prioridad: 'Alta',  fecha: '2025-03-15' },
  { id: '3', empresa: 'LogiTrack Perú',     contacto: 'Diego Paredes',   valor: 5000,  etapa: 'Calificado',  prioridad: 'Media', fecha: '2025-03-20' },
  { id: '4', empresa: 'Retail Smart',       contacto: 'Luis Castillo',   valor: 12000, etapa: 'Contactado',  prioridad: 'Alta',  fecha: '2025-03-22' },
  { id: '5', empresa: 'Edu Digital',        contacto: 'Sofía Lima',      valor: 4500,  etapa: 'Nuevo',       prioridad: 'Baja',  fecha: '2025-03-25' },
  { id: '6', empresa: 'FinTech Now',        contacto: 'Marcos Herrera',  valor: 20000, etapa: 'Nuevo',       prioridad: 'Alta',  fecha: '2025-03-28' },
  { id: '7', empresa: 'SaludTech LATAM',    contacto: 'Valeria Torres',  valor: 12000, etapa: 'Perdido',     prioridad: 'Media', fecha: '2025-02-14' },
  { id: '8', empresa: 'AgroData',           contacto: 'Ramón Suárez',    valor: 7000,  etapa: 'Ganado',      prioridad: 'Media', fecha: '2025-02-28' },
  { id: '9', empresa: 'CloudOps Mx',        contacto: 'Patricia Núñez',  valor: 9500,  etapa: 'Calificado',  prioridad: 'Alta',  fecha: '2025-04-01' },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ empresa: '', contacto: '', valor: '', etapa: 'Nuevo' as Etapa, prioridad: 'Media' as Lead['prioridad'] });

  const leadsEnEtapa = (etapa: Etapa) => leads.filter(l => l.etapa === etapa);
  const valorEtapa   = (etapa: Etapa) => leadsEnEtapa(etapa).reduce((a, l) => a + l.valor, 0);

  const handleDragStart = (id: string) => setDragging(id);
  const handleDragOver  = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (etapa: Etapa) => {
    if (!dragging) return;
    setLeads(prev => prev.map(l => l.id === dragging ? { ...l, etapa } : l));
    setDragging(null);
  };

  const handleAddLead = () => {
    if (!form.empresa || !form.contacto || !form.valor) return;
    const nuevo: Lead = {
      id: Date.now().toString(),
      empresa: form.empresa,
      contacto: form.contacto,
      valor: parseInt(form.valor),
      etapa: form.etapa,
      prioridad: form.prioridad,
      fecha: new Date().toISOString().split('T')[0],
    };
    setLeads(prev => [...prev, nuevo]);
    setForm({ empresa: '', contacto: '', valor: '', etapa: 'Nuevo', prioridad: 'Media' });
    setShowModal(false);
  };

  const totalPipeline = leads.filter(l => l.etapa !== 'Perdido').reduce((a, l) => a + l.valor, 0);
  const totalGanado   = leads.filter(l => l.etapa === 'Ganado').reduce((a, l) => a + l.valor, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Pipeline de Ventas</h1>
          <p className="text-gray-400 mt-1">Vista Kanban — arrastra las tarjetas entre etapas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
        >
          + Nuevo Lead
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Pipeline</p>
          <p className="text-xl font-bold text-white">${totalPipeline.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Ganado</p>
          <p className="text-xl font-bold text-green-400">${totalGanado.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Leads Activos</p>
          <p className="text-xl font-bold text-orange-400">{leads.filter(l => !['Ganado','Perdido'].includes(l.etapa)).length}</p>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {ETAPAS.map((etapa) => (
          <div
            key={etapa}
            className={`flex-shrink-0 w-52 rounded-xl border ${ETAPA_COLORS[etapa]} flex flex-col`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(etapa)}
          >
            {/* Columna header */}
            <div className={`px-3 py-2 rounded-t-xl flex items-center justify-between ${ETAPA_HEADER[etapa]}`}>
              <span className="text-xs font-semibold">{etapa}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs opacity-70">{leadsEnEtapa(etapa).length}</span>
              </div>
            </div>
            <p className="px-3 py-1 text-xs text-gray-500 border-b border-gray-700/50">
              ${valorEtapa(etapa).toLocaleString()}
            </p>

            {/* Tarjetas */}
            <div className="flex-1 p-2 space-y-2 min-h-24">
              {leadsEnEtapa(etapa).map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                  className={`bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-orange-500/40 transition-colors ${dragging === lead.id ? 'opacity-50' : ''}`}
                >
                  <p className="text-xs font-semibold text-white leading-tight mb-1">{lead.empresa}</p>
                  <p className="text-xs text-gray-500 mb-2">{lead.contacto}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400">${lead.valor.toLocaleString()}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${PRIORIDAD_COLORS[lead.prioridad]}`}>
                      {lead.prioridad}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal nuevo lead */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Nuevo Lead</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Empresa', key: 'empresa', type: 'text' },
                { label: 'Contacto', key: 'contacto', type: 'text' },
                { label: 'Valor estimado ($)', key: 'valor', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm text-gray-400 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Etapa</label>
                <select value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value as Etapa })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm">
                  {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Prioridad</label>
                <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value as Lead['prioridad'] })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm">
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">Cancelar</button>
                <button onClick={handleAddLead} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">Agregar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
