'use client';

import { useSession, signOut } from 'next-auth/react';

const ROLE_LABELS: Record<string, string> = {
  ADMIN:        'Administrador',
  PARTNER:      'Socio',
  COLLABORATOR: 'Colaborador',
};

export default function SidebarUser({ collapsed = false }: { collapsed?: boolean }) {
  const { data: session } = useSession();

  const name    = session?.user?.name  ?? 'Usuario';
  const email   = session?.user?.email ?? '';
  const role    = (session?.user as { role?: string })?.role ?? '';
  const initial = name.charAt(0).toUpperCase();

  if (collapsed) {
    return (
      <div className="p-2 border-t border-gray-800 flex flex-col items-center gap-2">
        <div
          title={`${name} — ${ROLE_LABELS[role] ?? role}`}
          className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0"
        >
          <span className="font-semibold text-black text-sm">{initial}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="Cerrar sesión"
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors border border-gray-800"
          style={{ color: '#6b7280' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = '#f87171';
            (e.currentTarget as HTMLElement).style.background = 'rgba(127,29,29,0.2)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(127,29,29,0.5)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = '#6b7280';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgb(31,41,55)';
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-800">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
          <span className="font-semibold text-black text-sm">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-orange-400 text-sm truncate">{name}</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
          {role && <p className="text-xs text-gray-600">{ROLE_LABELS[role] ?? role}</p>}
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors border border-gray-800 hover:border-red-900"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Cerrar sesión
      </button>
    </div>
  );
}
