'use client';

import { useState } from 'react';

const roadmap = [
  {
    fase: 'Investigación',
    icono: '🔬',
    estado: 'completado',
    descripcion: 'Análisis de mercado, definición de arquitectura y pruebas de concepto con modelos de IA.',
    items: ['Análisis de amenazas comunes', 'Selección de modelos LLM', 'Arquitectura base definida'],
    fecha: 'Ene – Feb 2025',
  },
  {
    fase: 'Beta',
    icono: '⚙️',
    estado: 'activo',
    descripcion: 'Desarrollo del core del agente, integración con n8n y primeras pruebas con clientes piloto.',
    items: ['Motor de detección v1', 'Dashboard de alertas', 'Integración n8n + Alibaba Cloud', 'Cliente piloto onboarding'],
    fecha: 'Mar – Jun 2025',
  },
  {
    fase: 'Lanzamiento',
    icono: '🚀',
    estado: 'pendiente',
    descripcion: 'Versión estable lista para producción, documentación completa y estrategia comercial activa.',
    items: ['Hardening de seguridad', 'Documentación técnica', 'Pricing y planes', 'Lanzamiento público'],
    fecha: 'Jul – Sep 2025',
  },
];

const changelog = [
  { version: 'v0.3.0', fecha: 'Abr 2025', tipo: 'feature', descripcion: 'Dashboard de alertas en tiempo real con categorización por severidad.' },
  { version: 'v0.2.1', fecha: 'Mar 2025', tipo: 'fix',     descripcion: 'Corrección en el módulo de análisis de logs — falsos positivos reducidos en 40%.' },
  { version: 'v0.2.0', fecha: 'Mar 2025', tipo: 'feature', descripcion: 'Integración con n8n para respuesta automatizada a incidentes críticos.' },
  { version: 'v0.1.0', fecha: 'Feb 2025', tipo: 'feature', descripcion: 'Motor de detección de amenazas base. Primera versión funcional del agente.' },
];

const TIPO_BADGE: Record<string, string> = {
  feature: 'bg-green-900/30 text-green-400 border-green-800',
  fix:     'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  break:   'bg-red-900/30 text-red-400 border-red-800',
};

const ESTADO_STYLES: Record<string, { ring: string; dot: string; label: string }> = {
  completado: { ring: 'ring-green-500',  dot: 'bg-green-500',  label: 'Completado' },
  activo:     { ring: 'ring-orange-500', dot: 'bg-orange-500', label: 'En curso' },
  pendiente:  { ring: 'ring-gray-600',   dot: 'bg-gray-600',   label: 'Pendiente' },
};

export default function ProductosPage() {
  const [tab, setTab] = useState<'info' | 'roadmap' | 'changelog'>('info');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Productos</h1>
        <p className="text-gray-400 mt-1">Soluciones desarrolladas por ArchiTechIA</p>
      </div>

      {/* Producto card */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Agente de Seguridad AI</h2>
                <span className="text-sm text-white/70">v0.3.0 · Beta</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">En Desarrollo</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(['info', 'roadmap', 'changelog'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-orange-400 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
            >
              {t === 'info' ? 'Información' : t === 'roadmap' ? 'Roadmap' : 'Changelog'}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        {tab === 'info' && (
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">Descripción</h3>
                <p className="text-gray-300 leading-relaxed">
                  Agente inteligente de ciberseguridad impulsado por IA que monitorea, detecta y responde a amenazas en tiempo real. Analiza patrones de comportamiento, identifica vulnerabilidades y genera reportes automatizados para proteger la infraestructura de los clientes.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">Características</h3>
                <ul className="space-y-2">
                  {['Monitoreo continuo 24/7', 'Detección de amenazas en tiempo real', 'Análisis de comportamiento anómalo', 'Respuesta automatizada a incidentes', 'Reportes y alertas inteligentes', 'Integración con infraestructura existente'].map((c) => (
                    <li key={c} className="flex items-center gap-3 text-gray-300">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">Tecnologías</h3>
              <div className="flex flex-wrap gap-2">
                {['IA Generativa', 'Machine Learning', 'n8n', 'Cloud'].map((t) => (
                  <span key={t} className="px-3 py-1 bg-orange-900/30 text-orange-400 text-sm rounded-full border border-orange-800">{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Roadmap */}
        {tab === 'roadmap' && (
          <div className="p-8">
            <div className="relative">
              {/* Línea de progreso */}
              <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-700 hidden lg:block">
                <div className="h-full bg-gradient-to-r from-green-500 via-orange-500 to-gray-700 w-2/3 transition-all" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                {roadmap.map((fase) => {
                  const s = ESTADO_STYLES[fase.estado];
                  return (
                    <div key={fase.fase} className={`bg-gray-700/40 border border-gray-600 rounded-xl p-5 ring-1 ${s.ring}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full ring-2 ${s.ring} flex items-center justify-center text-base`}>
                          {fase.icono}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{fase.fase}</p>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>
                            <span className="text-xs text-gray-400">{s.label} · {fase.fecha}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3 leading-relaxed">{fase.descripcion}</p>
                      <ul className="space-y-1.5">
                        {fase.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${fase.estado === 'completado' ? 'bg-green-400' : fase.estado === 'activo' ? 'bg-orange-400' : 'bg-gray-600'}`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Changelog */}
        {tab === 'changelog' && (
          <div className="p-8">
            <div className="space-y-4">
              {changelog.map((entry) => (
                <div key={entry.version} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                    <div className="w-0.5 h-full bg-gray-700 mt-1" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-bold text-white">{entry.version}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${TIPO_BADGE[entry.tipo]}`}>
                        {entry.tipo === 'feature' ? '✨ feature' : '🔧 fix'}
                      </span>
                      <span className="text-xs text-gray-500">{entry.fecha}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{entry.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
