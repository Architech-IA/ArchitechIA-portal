'use client';

import { useEffect, useState } from 'react';
import PipelineView from '@/components/PipelineView';
import LeadsNav from '@/components/LeadsNav';

export default function PipelinePage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([l, u]) => { setLeads(l); setUsers(u); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Pipeline</h1>
        <p className="text-gray-400 mt-1">Visualización del pipeline de ventas por etapas</p>
      </div>
      <LeadsNav />
      <PipelineView leads={leads} users={users} onLeadsChange={setLeads} />
    </div>
  );
}
