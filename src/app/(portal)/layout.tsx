'use client';

import TopBar from "@/components/TopBar";
import SidebarUser from "@/components/SidebarUser";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: '/',             label: 'Dashboard',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/leads',        label: 'Leads',        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/pipeline',     label: 'Pipeline',     icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { href: '/clientes',     label: 'Clientes',     icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { href: '/proposals',    label: 'Propuestas',   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/projects',     label: 'Proyectos',    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { href: '/finanzas',     label: 'Finanzas',     icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/traceability', label: 'Trazabilidad', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/team',         label: 'Equipo',       icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/productos',    label: 'Productos',    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/cuentas',      label: 'Cuentas',      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="flex h-screen" style={{ background: '#111111' }}>

      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? '64px' : '256px',
          minWidth: collapsed ? '64px' : '256px',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #0f0f0f 100%)',
          borderRight: '1px solid rgba(249,115,22,0.15)',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          overflow: 'hidden',
        }}
        className="flex flex-col flex-shrink-0"
      >
        {/* Logo + toggle */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-900" style={{ minHeight: '72px' }}>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                ArchiTechIA
              </h1>
              <p className="text-gray-600 text-xs mt-0.5 tracking-wide uppercase">Portal Interno</p>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto">
              <span className="text-black font-bold text-sm">A</span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggle}
              title="Colapsar sidebar"
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
              style={{ color: '#4b5563' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f97316')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {/* Expand button when collapsed */}
          {collapsed && (
            <button
              onClick={toggle}
              title="Expandir sidebar"
              className="w-full flex items-center justify-center py-2 mb-2 rounded-lg transition-colors"
              style={{ color: '#4b5563' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f97316')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {navLinks.map(({ href, label, icon }) => {
            const active = isActive(href);
            return (
              <a
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className="flex items-center rounded-lg text-sm font-medium transition-all"
                style={{
                  gap:            collapsed ? '0' : '12px',
                  padding:        collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color:          active ? '#fb923c' : '#6b7280',
                  background:     active ? 'rgba(249,115,22,0.12)' : 'transparent',
                  border:         active ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent',
                  textDecoration: 'none',
                  whiteSpace:     'nowrap',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = '#e5e7eb';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = '#6b7280';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <svg
                  style={{ color: active ? '#fb923c' : '#4b5563', flexShrink: 0 }}
                  className="w-4 h-4"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                {!collapsed && label}
                {!collapsed && active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f97316' }} />
                )}
              </a>
            );
          })}
        </nav>

        <SidebarUser collapsed={collapsed} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto" style={{ background: '#141414' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
