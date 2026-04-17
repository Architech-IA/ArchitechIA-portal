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

const clientes: Cliente[] = [
  {
    id: '1',
    nombre: 'TechCorp S.A.',
    industria: 'Tecnología',
    contacto: 'Carlos Méndez',
    email: 'cmendez@techcorp.com',
    pais: 'México',
    estado: 'Activo',
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
    id: '2',
    nombre: 'Grupo Financiero NX',
    industria: 'Finanzas',
    contacto: 'Ana Rodríguez',
    email: 'arodriguez@gfnx.com',
    pais: 'Colombia',
    estado: 'Activo',
    proyectos: [
      { nombre: 'Automatización de Procesos', estado: 'Completado', progreso: 100 },
    ],
    propuestas: [
      { titulo: 'Automatización con n8n', monto: 8500, estado: 'Aceptado' },
      { titulo: 'Expansión de flujos', monto: 6000, estado: 'En Revisión' },
    ],
    valorTotal: 14500,
  },
  {
    id: '3',
    nombre: 'LogiTrack Perú',
    industria: 'Logística',
    contacto: 'Diego Paredes',
    email: 'dparedes@logitrack.pe',
    pais: 'Perú',
    estado: 'Activo',
    proyectos: [
      { nombre: 'Integración n8n – ERP', estado: 'En Progreso', progreso: 70 },
    ],
    propuestas: [
      { titulo: 'Integración de sistemas', monto: 5000, estado: 'Aceptado' },
    ],
    valorTotal: 5000,
  },
  {
    id: '4',
    nombre: 'SaludTech LATAM',
    industria: 'Salud',
    contacto: 'Valeria Torres',
    email: 'vtorres@saludtech.lat',
    pais: 'Argentina',
    estado: 'Inactivo',
    proyectos: [],
    propuestas: [
      { titulo: 'Portal de Pacientes AI', monto: 12000, estado: 'Rechazado' },
    ],
    valorTotal: 0,
  },
];

const estadoProyectoColor: Record<string, string> = {
  'En Progreso':  'bg-blue-900/30 text-blue-400',
  'Completado':   'bg-green-900/30 text-green-400',
  'Planificación':'bg-yellow-900/30 text-yellow-400',
};

const estadoPropuestaColor: Record<string, string> = {
  'Aceptado':     'bg-green-900/30 text-green-400',
  'En Revisión':  'bg-yellow-900/30 text-yellow-400',
  'Rechazado':    'bg-red-900/30 text-red-400',
  'Completado':   'bg-gray-700 text-gray-400',
};

export default function ClientesPage() {
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const filtrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.industria.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.pais.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8">
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
            onChange={(e) => setBusqueda(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
          />
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtrados.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSeleccionado(c)}
                className="hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal detalle */}
      {seleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
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
              {/* Stats */}
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

              {/* Proyectos */}
              {seleccionado.proyectos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">Proyectos</h3>
                  <div className="space-y-2">
                    {seleccionado.proyectos.map((p) => (
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

              {/* Propuestas */}
              {seleccionado.propuestas.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">Propuestas</h3>
                  <div className="space-y-2">
                    {seleccionado.propuestas.map((p) => (
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
    </div>
  );
}
