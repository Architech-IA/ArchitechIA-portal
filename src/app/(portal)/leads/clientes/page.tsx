'use client';

import ClientesTab from '@/components/ClientesTab';
import LeadsNav from '@/components/LeadsNav';

export default function ClientesPage() {
  return (
    <div style={{ padding: '10px 32px 32px' }}>
      <LeadsNav />
      <div className="mb-6">
        <p className="text-gray-400 mt-1">Gestión de clientes activos y seguimiento post-venta</p>
      </div>
      <ClientesTab />
    </div>
  );
}
