'use client';

import { useState, useEffect } from 'react';

interface ResourceCard {
  title: string;
  description: string;
  href: string;
  icon: string;
}

const RESOURCES: ResourceCard[] = [
  {
    title: 'Cuentas',
    description: 'Gestiona las plataformas, servicios y cuentas activas del equipo.',
    href: '/resources/cuentas',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
];

export default function ResourcesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Resources</h1>
        <p className="text-gray-400 mt-1">Centro de recursos, herramientas y cuentas del equipo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {RESOURCES.map((res, idx) => (
          <a
            key={res.href}
            href={res.href}
            className="group block bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              transition: `all 0.35s ease ${idx * 80}ms`,
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={res.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {res.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">{res.description}</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-600 group-hover:text-orange-400 transition-colors flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
