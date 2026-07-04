'use client';

import NichesTab from '@/components/NichesTab';
import LeadsNav from '@/components/LeadsNav';

export default function MercadoPage() {
  return (
    <div style={{ padding: '10px 32px 32px' }}>
      <LeadsNav />
      <div className="mb-6">
        <p className="text-gray-400 mt-1">Análisis de nichos de mercado y mapa de oportunidades</p>
      </div>
      <NichesTab />
    </div>
  );
}
