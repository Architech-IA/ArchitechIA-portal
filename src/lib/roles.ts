export const SUPERADMIN_EMAIL = 'admin@architechia.co'

export function hasAdminAccess(role?: string | null): boolean {
  return role === 'SUPERADMIN' || role === 'ADMIN'
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'SUPERADMIN'
}

export const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  SUPERADMIN:             { label: 'Super Admin',          cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ADMIN:                  { label: 'Admin',                cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  GERENTE_COMERCIAL:      { label: 'Gerente Comercial',    cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30'       },
  GERENTE_ADMINISTRATIVO: { label: 'Gerente Administrativo', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  GERENTE_OPERACIONES:    { label: 'Gerente Operaciones',  cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  ARQUITECTO_SOLUCIONES:  { label: 'Arquitecto Soluciones', cls: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'     },
  PARTNER:                { label: 'Socio',                cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30'       },
  COLLABORATOR:           { label: 'Colaborador',          cls: 'bg-gray-700 text-gray-400 border-gray-600'             },
}

// Roles asignables por ADMIN (no puede asignar SUPERADMIN)
export const ASSIGNABLE_ROLES_ADMIN = [
  'ADMIN', 'GERENTE_COMERCIAL', 'GERENTE_ADMINISTRATIVO',
  'GERENTE_OPERACIONES', 'ARQUITECTO_SOLUCIONES', 'PARTNER', 'COLLABORATOR',
]

// Roles asignables por SUPERADMIN (todos excepto SUPERADMIN — solo uno puede existir)
export const ASSIGNABLE_ROLES_SUPER = ASSIGNABLE_ROLES_ADMIN
