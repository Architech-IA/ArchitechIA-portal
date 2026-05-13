'use client';

export default function BrandPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Brand</h1>
        <p className="text-gray-400 mt-1">Assets, guías de marca y recursos visuales oficiales</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">En construcción</h3>
        <p className="text-gray-400 max-w-lg mx-auto">
          Esta sección estará disponible próximamente. Aquí encontrarás el logo oficial, paleta de colores, tipografías, templates de presentación y guías de uso de marca.
        </p>
      </div>
    </div>
  );
}
