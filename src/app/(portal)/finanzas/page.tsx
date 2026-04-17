'use client';

import { useState } from 'react';

const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

const ingresos = [12000, 18500, 15000, 22000, 19500, 27000];
const gastos   = [ 8000, 10200,  9500, 11000, 10800, 13500];

const proyectos = [
  { nombre: 'Agente de Seguridad AI – Cliente A', ingreso: 15000, gasto: 6200, estado: 'En progreso' },
  { nombre: 'Automatización de Procesos – Cliente B', ingreso: 8500, gasto: 3100, estado: 'Completado' },
  { nombre: 'Dashboard BI – Cliente C', ingreso: 12000, gasto: 4800, estado: 'En progreso' },
  { nombre: 'Integración n8n – Cliente D', ingreso: 5000, gasto: 1900, estado: 'Completado' },
];

const gastosCategorias = [
  { categoria: 'Infraestructura Cloud', monto: 4200 },
  { categoria: 'Herramientas y SaaS', monto: 2800 },
  { categoria: 'Marketing', monto: 1500 },
  { categoria: 'Operaciones', monto: 3100 },
  { categoria: 'Otros', monto: 900 },
];

export default function FinanzasPage() {
  const [mesActivo, setMesActivo] = useState(5);

  const totalIngresos = ingresos.reduce((a, b) => a + b, 0);
  const totalGastos   = gastos.reduce((a, b) => a + b, 0);
  const utilidad      = totalIngresos - totalGastos;
  const margen        = Math.round((utilidad / totalIngresos) * 100);
  const maxVal        = Math.max(...ingresos, ...gastos);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Finanzas</h1>
        <p className="text-gray-400 mt-1">Ingresos, gastos y rentabilidad de ArchiTechIA</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Ingresos totales', valor: totalIngresos, color: 'text-green-400', bg: 'bg-green-900/20 border-green-800' },
          { label: 'Gastos totales',   valor: totalGastos,   color: 'text-red-400',   bg: 'bg-red-900/20 border-red-800'   },
          { label: 'Utilidad neta',    valor: utilidad,      color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800' },
          { label: 'Margen',           valor: null,          color: 'text-blue-400',  bg: 'bg-blue-900/20 border-blue-800', extra: `${margen}%` },
        ].map((k) => (
          <div key={k.label} className={`rounded-xl p-5 border ${k.bg}`}>
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>
              {k.extra ?? `$${k.valor!.toLocaleString()}`}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfica de barras */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-6">Flujo de Caja — 2025</h2>
        <div className="flex items-end gap-4 h-48">
          {meses.map((mes, i) => (
            <div
              key={mes}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
              onClick={() => setMesActivo(i)}
            >
              <div className="w-full flex gap-1 items-end justify-center" style={{ height: '160px' }}>
                {/* Barra ingreso */}
                <div
                  className={`flex-1 rounded-t transition-all ${i === mesActivo ? 'bg-green-400' : 'bg-green-700/60'}`}
                  style={{ height: `${(ingresos[i] / maxVal) * 160}px` }}
                  title={`Ingreso: $${ingresos[i].toLocaleString()}`}
                />
                {/* Barra gasto */}
                <div
                  className={`flex-1 rounded-t transition-all ${i === mesActivo ? 'bg-red-400' : 'bg-red-700/60'}`}
                  style={{ height: `${(gastos[i] / maxVal) * 160}px` }}
                  title={`Gasto: $${gastos[i].toLocaleString()}`}
                />
              </div>
              <span className={`text-xs ${i === mesActivo ? 'text-orange-400 font-semibold' : 'text-gray-500'}`}>{mes}</span>
            </div>
          ))}
        </div>
        {/* Detalle mes activo */}
        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block"/> Ingreso <span className="text-green-400 font-semibold">${ingresos[mesActivo].toLocaleString()}</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block"/> Gasto <span className="text-red-400 font-semibold">${gastos[mesActivo].toLocaleString()}</span></div>
          <div className="flex items-center gap-2 ml-auto">Utilidad <span className="text-orange-400 font-semibold">${(ingresos[mesActivo] - gastos[mesActivo]).toLocaleString()}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gastos por categoría */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Gastos por Categoría</h2>
          <div className="space-y-3">
            {gastosCategorias.map((g) => {
              const pct = Math.round((g.monto / totalGastos) * 100);
              return (
                <div key={g.categoria}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{g.categoria}</span>
                    <span className="text-gray-400">${g.monto.toLocaleString()} <span className="text-orange-400">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rentabilidad por proyecto */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Rentabilidad por Proyecto</h2>
          <div className="space-y-3">
            {proyectos.map((p) => {
              const util = p.ingreso - p.gasto;
              const mrg  = Math.round((util / p.ingreso) * 100);
              return (
                <div key={p.nombre} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-white leading-tight">{p.nombre}</p>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${p.estado === 'Completado' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                      {p.estado}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-1">
                    <span>Ingreso: <span className="text-green-400">${p.ingreso.toLocaleString()}</span></span>
                    <span>Gasto: <span className="text-red-400">${p.gasto.toLocaleString()}</span></span>
                    <span>Margen: <span className="text-orange-400">{mrg}%</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
