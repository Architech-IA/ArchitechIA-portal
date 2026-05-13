'use client';

import ProspectorTab from '@/components/ProspectorTab';

export default function ProspectorPage() {
  return (
    <ProspectorTab
      initialView="search"
      onLeadsCreated={() => {
        // noop – la tabla de leads se recarga al navegar
      }}
    />
  );
}
