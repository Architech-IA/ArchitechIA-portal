'use client';

import NichesTab from '@/components/NichesTab';
import LeadsNav from '@/components/LeadsNav';

export default function MercadoPage() {
  return (
    <div className="p-8">
      <LeadsNav />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Mercado</h1>
        <p className="text-gray-400 mt-1">Análisis de nichos de mercado y mapa de oportunidades</p>
      </div>
      <NichesTab />
    </div>
  );
}
