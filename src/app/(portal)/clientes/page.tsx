'use client';

import { useState } from 'react';

interface Cliente {
  id: string;
  nombre: string;
  industria: string;
  contacto: string;
  email: string;
  pais: string;
  estado: 'Activo' | 'Inactivo';
  proyectos: { nombre: string; estado: string; progreso: number }[];
  propuestas: { titulo: string; monto: number; estado: string }[];
  valorTotal: number;
}

const INITIAL_CLIENTES: Cliente[] = [
  {
    id: '1', nombre: 'TechCorp S.A.', industria: 'Tecnología', contacto: 'Carlos Méndez',
    email: 'cmendez@techcorp.com', pais: 'México', estado: 'Activo',
    proyectos: [
      { nombre: 'Agente de Seguridad AI', estado: 'En Progreso', progreso: 45 },
      { nombre: 'Dashboard BI', estado: 'Completado', progreso: 100 },
    ],
    propuestas: [
      { titulo: 'Implementación SOC AI', monto: 15000, estado: 'Aceptado' },
      { titulo: 'Módulo de Reportes', monto: 5000, estado: 'Completado' },
    ],
    valorTotal: 20000,
  },
  {
    id: '2', nombre: 'Grupo Financiero NX', industria: 'Finanzas', contacto: 'Ana Rodríguez',
    email: 'arodriguez@gfnx.com', pais: 'Colombia', estado: 'Activo',
    proyectos: [{ nombre: 'Automatización de Procesos', estado: 'Completado', progreso: 100 }],
    propuestas: [
      { titulo: 'Automatización con n8n', monto: 8500, estado: 'Aceptado' },
      { titulo: 'Expansión de flujos', monto: 6000, estado: 'En Revisión' },
    ],
    valorTotal: 14500,
  },
  {
    id: '3', nombre: 'LogiTrack Perú', industria: 'Logística', contacto: 'Diego Paredes',
    email: 'dparedes@logitrack.pe', pais: 'Perú', estado: 'Activo',
    proyectos: [{ nombre: 'Integración n8n – ERP', estado: 'En Progreso', progreso: 70 }],
    propuestas: [{ titulo: 'Integración de sistemas', monto: 5000, estado: 'Aceptado' }],
    valorTotal: 5000,
  },
  {
    id: '4', nombre: 'SaludTech LATAM', industria: 'Salud', contacto: 'Valeria Torres',
    email: 'vtorres@saludtech.lat', pais: 'Argentina', estado: 'Inactivo',
    proyectos: [],
    propuestas: [{ titulo: 'Portal de Pacientes AI', monto: 12000, estado: 'Rechazado' }],
    valorTotal: 0,
  },
];

const EMPTY_FORM = {
  nombre: '', industria: '', contacto: '', email: '', pais: '', estado: 'Activo' as 'Activo' | 'Inactivo', valorTotal: '',
};

const estadoProyectoColor: Record<string, string> = {
  'En Progreso':   'bg-blue-900/30 text-blue-400',
  'Completado':    'bg-green-900/30 text-green-400',
  'Planificación': 'bg-yellow-900/30 text-yellow-400',
};

const estadoPropuestaColor: Record<string, string> = {
  'Aceptado':   'bg-green-900/30 text-green-400',
  'En Revisión':'bg-yellow-900/30 text-yellow-400',
  'Rechazado':  'bg-red-900/30 text-red-400',
  'Completado': 'bg-gray-700 text-gray-400',
};

export default function ClientesPage() {
  const [clientes, setClientes]     = useState<Cliente[]>(INITIAL_CLIENTES);
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda]     = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [confirmDel, setConfirmDel] = useState<Cliente | null>(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.industria.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.pais.toLowerCase().includes(busqueda.toLowerCase())
  );

  const openNew = () => {
    setEditCliente(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Cliente, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditCliente(c);
    setFormData({
      nombre: c.nombre, industria: c.industria, contacto: c.contacto,
      email: c.email, pais: c.pais, estado: c.estado, valorTotal: String(c.valorTotal),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editCliente) {
      setClientes(prev => prev.map(c =>
        c.id === editCliente.id
          ? { ...c, ...formData, valorTotal: parseFloat(formData.valorTotal) || 0 }
          : c
      ));
      if (seleccionado?.id === editCliente.id) {
        setSeleccionado(prev => prev ? { ...prev, ...formData, valorTotal: parseFloat(formData.valorTotal) || 0 } : null);
      }
    } else {
      const nuevo: Cliente = {
        id: Date.now().toString(),
        nombre: formData.nombre, industria: formData.industria,
        contacto: formData.contacto, email: formData.email,
        pais: formData.pais, estado: formData.estado,
        valorTotal: parseFloat(formData.valorTotal) || 0,
        proyectos: [], propuestas: [],
      };
      setClientes(prev => [nuevo, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDel) return;
    setClientes(prev => prev.filter(c => c.id !== confirmDel.id));
    if (seleccionado?.id === confirmDel.id) setSeleccionado(null);
    setConfirmDel(null);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 mt-1">Directorio de clientes activos y su historial</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
          />
          <button onClick={openNew} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm whitespace-nowrap">
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Clientes</p>
          <p className="text-2xl font-bold text-white">{clientes.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-400">{clientes.filter(c => c.estado === 'Activo').length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Valor Total</p>
          <p className="text-2xl font-bold text-orange-400">${clientes.reduce((a, c) => a + c.valorTotal, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Industria</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">País</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Proyectos</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtrados.map(c => (
              <tr key={c.id} onClick={() => setSeleccionado(c)} className="hover:bg-gray-700/50 cursor-pointer transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {c.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{c.nombre}</p>
                      <p className="text-xs text-gray-500">{c.contacto}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{c.industria}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{c.pais}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{c.proyectos.length}</td>
                <td className="px-6 py-4 text-sm font-semibold text-orange-400">${c.valorTotal.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.estado === 'Activo' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {c.estado}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => openEdit(c, e)}
                      className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDel(c); }}
                      className="px-3 py-1 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal detalle */}
      {seleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-500 to-orange-700 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                    {seleccionado.nombre.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{seleccionado.nombre}</h2>
                    <p className="text-orange-100 text-sm">{seleccionado.contacto} · {seleccionado.email}</p>
                    <p className="text-orange-200 text-xs mt-0.5">{seleccionado.industria} · {seleccionado.pais}</p>
                  </div>
                </div>
                <button onClick={() => setSeleccionado(null)} className="text-white/80 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Proyectos</p>
                  <p className="text-xl font-bold text-white">{seleccionado.proyectos.length}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Propuestas</p>
                  <p className="text-xl font-bold text-white">{seleccionado.propuestas.length}</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">Valor</p>
                  <p className="text-lg font-bold text-orange-400">${seleccionado.valorTotal.toLocaleString()}</p>
                </div>
              </div>

              {seleccionado.proyectos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">Proyectos</h3>
                  <div className="space-y-2">
                    {seleccionado.proyectos.map(p => (
                      <div key={p.nombre} className="bg-gray-700/40 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-white">{p.nombre}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${estadoProyectoColor[p.estado] ?? 'bg-gray-700 text-gray-400'}`}>{p.estado}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-600 rounded-full h-1.5">
                            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${p.progreso}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{p.progreso}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {seleccionado.propuestas.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">Propuestas</h3>
                  <div className="space-y-2">
                    {seleccionado.propuestas.map(p => (
                      <div key={p.titulo} className="flex items-center justify-between bg-gray-700/40 rounded-lg p-3">
                        <p className="text-sm text-white">{p.titulo}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-orange-400">${p.monto.toLocaleString()}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${estadoPropuestaColor[p.estado] ?? 'bg-gray-700 text-gray-400'}`}>{p.estado}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nombre empresa</label>
                  <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Industria</label>
                  <input required type="text" value={formData.industria} onChange={e => setFormData({...formData, industria: e.target.value})} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contacto</label>
                  <input required type="text" value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">País</label>
                  <input required type="text" value={formData.pais} onChange={e => setFormData({...formData, pais: e.target.value})} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valor Total ($)</label>
                  <input type="number" value={formData.valorTotal} onChange={e => setFormData({...formData, valorTotal: e.target.value})} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value as 'Activo' | 'Inactivo'})} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg">{editCliente ? 'Guardar Cambios' : 'Crear Cliente'}</button>
              </div>
            </form>
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
                <h3 className="text-white font-semibold">Eliminar cliente</h3>
                <p className="text-gray-400 text-sm">¿Seguro que deseas eliminar <span className="text-white font-medium">{confirmDel.nombre}</span>? Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
