'use client'

import { usePathname } from 'next/navigation'
import SolutionsTabs from './SolutionsTabs'

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Las páginas de detalle de una PoC (/solutions/pilots/[id]) ya tienen sus propios
  // tabs (General, Arquitectura, Plan de Trabajo, ...) — no duplicar el nav de Solutions ahí.
  const isPocDetail = /^\/solutions\/pilots\/[^/]+$/.test(pathname || '')
  return (
    <div>
      {!isPocDetail && <SolutionsTabs />}
      {children}
    </div>
  )
}
