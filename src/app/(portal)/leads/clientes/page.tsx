'use client';

import ClientesTab from '@/components/ClientesTab';
import LeadsNav from '@/components/LeadsNav';

export default function ClientesPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        <p className="text-gray-400 mt-1">Gestión de clientes activos y seguimiento post-venta</p>
      </div>
      <LeadsNav />
      <ClientesTab />
    </div>
  );
}
