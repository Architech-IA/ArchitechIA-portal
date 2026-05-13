'use client';

export default function BusinessPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">BUSINESS</h1>
        <p className="text-gray-400 mt-1">Estrategia comercial, leads, propuestas y gestión de clientes</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">En construcción</h3>
        <p className="text-gray-400 max-w-lg mx-auto">
          Esta sección estará disponible próximamente. Aquí encontrarás métricas comerciales, pipeline de ventas y análisis de negocio.
        </p>
      </div>
    </div>
  );
}
