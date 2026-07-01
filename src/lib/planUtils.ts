/** Extrae las fases del cronograma desde el plan de trabajo en markdown.
 *
 *  Prioridad 1 — Sección "Sesiones de trabajo": detecta los encabezados
 *  `### Sesión N — Título` y los devuelve como fases, en orden.
 *
 *  Prioridad 2 — Sección "Pasos de ejecución" (o similar): extrae la
 *  lista numerada dentro de esa sección.
 *
 *  Prioridad 3 (fallback) — primer bloque de lista numerada del documento. */
export function extractStepsFromPlan(markdown: string): string[] {
  const lines = markdown.split('\n')

  // ── Prioridad 1: sesiones de trabajo ──────────────────────────────────────
  let inSesiones = false
  const sesiones: string[] = []

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)/)
    const h3 = line.match(/^###\s+(.*)/)
    if (h2) {
      if (/sesiones de trabajo/i.test(h2[1])) { inSesiones = true; continue }
      else if (inSesiones) break
    }
    if (inSesiones && h3) sesiones.push(h3[1].trim())
  }
  if (sesiones.length > 0) return sesiones

  // ── Prioridad 2: sección "Pasos de ejecución" o similar ───────────────────
  let inTarget = false, foundSection = false
  let collected: string[] = []

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.*)/)
    if (heading) {
      if (/pasos|ejecuci[oó]n|roadmap|implementaci[oó]n/i.test(heading[1])) {
        inTarget = true; foundSection = true; continue
      } else if (inTarget) break
    }
    if (inTarget) {
      const item = line.match(/^\s*\d+\.\s+(.*)/)
      if (item) collected.push(item[1].trim())
    }
  }
  if (foundSection && collected.length > 0) return collected.map(s => s.replace(/\*\*/g, ''))

  // ── Prioridad 3 (fallback): primer bloque numerado del documento ───────────
  collected = []
  let collecting = false
  for (const line of lines) {
    const item = line.match(/^\s*\d+\.\s+(.*)/)
    if (item) { collecting = true; collected.push(item[1].trim()) }
    else if (collecting && line.trim() !== '') break
  }
  return collected.map(s => s.replace(/\*\*/g, ''))
}
