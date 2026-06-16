'use client';

import ProspectorTab from '@/components/ProspectorTab';
import LeadsNav from '@/components/LeadsNav';

export default function ProspectorPage() {
  return (
    <div className="p-8">
      <LeadsNav />
      <div className="mb-6">
        <p className="text-gray-400 mt-1">Herramienta de prospección inteligente y búsqueda de nuevos leads</p>
      </div>
      <ProspectorTab
        initialView="search"
        onLeadsCreated={() => {
          // noop – la tabla de leads se recarga al navegar
        }}
      />
    </div>
  );
}
