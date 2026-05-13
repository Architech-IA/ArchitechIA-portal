'use client';

export default function FinancePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">FINANCE</h1>
        <p className="text-gray-400 mt-1">Finanzas, presupuestos, pagos y control de registros contables</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">En construcción</h3>
        <p className="text-gray-400 max-w-lg mx-auto">
          Esta sección estará disponible próximamente. Aquí encontrarás reportes financieros, presupuestos y control de pagos.
        </p>
      </div>
    </div>
  );
}
