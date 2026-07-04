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
    <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.07)' }}>
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <a
            key={tab.href}
            href={tab.href}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s',
              background: active ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'transparent',
              color: active ? '#fff' : '#64748b',
              boxShadow: active ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            {tab.label}
          </a>
        );
      })}
    </div>
  );
}
