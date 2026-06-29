'use client'

import { CalendarRange } from 'lucide-react'

export interface FaseCronograma {
  id: string
  fase: string
  fechaInicio: string
  fechaFin: string
  estado: string
}

const ESTADO_COLOR: Record<string, { bg: string; text: string }> = {
  PENDIENTE: { bg: '#475569', text: '#94a3b8' },
  EN_CURSO: { bg: '#06B6D4', text: '#22d3ee' },
  COMPLETADA: { bg: '#10B981', text: '#34d399' },
}

function fmt(d: string) {
  if (!d) return ''
  const date = new Date(d + 'T00:00:00')
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export default function CronogramaTimeline({ fases }: { fases: FaseCronograma[] }) {
  const completas = fases.filter(f => f.fechaInicio && f.fechaFin)
  const incompletas = fases.length - completas.length

  if (fases.length === 0) {
    return (
      <div className="text-center py-10">
        <CalendarRange size={28} className="text-gray-700 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Sin fases todavía.</p>
      </div>
    )
  }

  if (completas.length === 0) {
    return (
      <div className="text-center py-10">
        <CalendarRange size={28} className="text-gray-700 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Ninguna fase tiene fecha de inicio y fin todavía.</p>
        <p className="text-gray-600 text-xs mt-1">Completá las fechas en la vista Lista para ver la línea de tiempo.</p>
      </div>
    )
  }

  const starts = completas.map(f => new Date(f.fechaInicio + 'T00:00:00').getTime())
  const ends = completas.map(f => new Date(f.fechaFin + 'T00:00:00').getTime())
  const min = Math.min(...starts)
  const max = Math.max(...ends)
  const span = Math.max(max - min, 1)

  return (
    <div className="space-y-4">
      {incompletas > 0 && (
        <p className="text-gray-600 text-xs">
          {incompletas} fase{incompletas > 1 ? 's' : ''} sin fecha completa no se muestra{incompletas > 1 ? 'n' : ''} acá — completalas en la vista Lista.
        </p>
      )}
      <div className="flex items-center justify-between text-[11px] text-gray-600 font-mono">
        <span>{fmt(completas[starts.indexOf(min)]?.fechaInicio || '')}</span>
        <span>{fmt(completas[ends.indexOf(max)]?.fechaFin || '')}</span>
      </div>
      <div className="space-y-3">
        {completas.map(f => {
          const s = new Date(f.fechaInicio + 'T00:00:00').getTime()
          const e = new Date(f.fechaFin + 'T00:00:00').getTime()
          const leftPct = ((s - min) / span) * 100
          const widthPct = Math.max(((e - s) / span) * 100, 2)
          const color = ESTADO_COLOR[f.estado] || ESTADO_COLOR.PENDIENTE
          return (
            <div key={f.id}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-sm text-gray-200 truncate">{f.fase || 'Sin nombre'}</span>
                <span className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: `${color.bg}20`, color: color.text }}>
                  {f.estado}
                </span>
              </div>
              <div className="relative h-2.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: color.bg, boxShadow: `0 0 8px ${color.bg}80` }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[10px] text-gray-600 font-mono">{fmt(f.fechaInicio)}</span>
                <span className="text-[10px] text-gray-600 font-mono">{fmt(f.fechaFin)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
