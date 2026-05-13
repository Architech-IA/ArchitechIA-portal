'use client';

import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/leads/lista',       label: 'Leads'      },
  { href: '/leads/clientes',    label: 'Clientes'   },
  { href: '/leads/prospector',  label: 'Prospector' },
  { href: '/leads/pipeline',    label: 'Timeline'   },
  { href: '/leads/mercado',     label: 'Mercado'    },
];

export default function LeadsNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1 w-fit">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <a
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              active
                ? 'bg-orange-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </a>
        );
      })}
    </div>
  );
}
