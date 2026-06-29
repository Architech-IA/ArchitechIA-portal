'use client'

import { useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Monitor, Server, Database, Workflow, Brain, Clock, Zap, Globe2, Trash2, Plus, Upload, X,
} from 'lucide-react'

export interface ArchNode {
  id: string
  label: string
  type: ArchNodeType
  x: number
  y: number
}

type ArchNodeType = 'frontend' | 'backend' | 'database' | 'api' | 'ia' | 'queue' | 'cache' | 'externo'

const NODE_TYPES: Record<ArchNodeType, { label: string; icon: typeof Monitor; color: string }> = {
  frontend: { label: 'Frontend', icon: Monitor, color: '#3B82F6' },
  backend:  { label: 'Backend',  icon: Server,   color: '#8B5CF6' },
  database: { label: 'Base de datos', icon: Database, color: '#10B981' },
  api:      { label: 'API',      icon: Workflow, color: '#06B6D4' },
  ia:       { label: 'IA / LLM', icon: Brain,    color: '#FF5A00' },
  queue:    { label: 'Cola/Job', icon: Clock,     color: '#F59E0B' },
  cache:    { label: 'Cache',    icon: Zap,       color: '#EAB308' },
  externo:  { label: 'Servicio externo', icon: Globe2, color: '#64748B' },
}

const NODE_W = 140
const NODE_H = 64

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

/** Adivina el tipo de componente a partir del label, para imports que no traen el tipo explícito. */
function guessType(label: string): ArchNodeType {
  const s = label.toLowerCase()
  if (/\b(ia|ai|llm|claude|gpt|openai|modelo)\b/.test(s)) return 'ia'
  if (/\b(cola|queue|job|worker|cron|kafka|sqs|rabbitmq)\b/.test(s)) return 'queue'
  if (/\b(cache|redis|memcache)\b/.test(s)) return 'cache'
  if (/\b(base de datos|database|postgres|mysql|mongo|sql|db)\b/.test(s)) return 'database'
  if (/\bapi\b/.test(s)) return 'api'
  if (/\b(frontend|front|react|next\.?js|vue|ui|cliente|spa|web app)\b/.test(s)) return 'frontend'
  if (/\b(backend|back|server|servidor|node|express|servicio)\b/.test(s)) return 'backend'
  return 'externo'
}

interface ImportItem { label: string; type: ArchNodeType }

/** Acepta el JSON propio del lienzo (array de nodos con label/type). */
function parseJsonImport(text: string): ImportItem[] | null {
  let data: unknown
  try { data = JSON.parse(text) } catch { return null }
  if (!Array.isArray(data)) return null
  const items: ImportItem[] = data
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && typeof item.label === 'string')
    .map(item => {
      const label = String(item.label).trim()
      const rawType = item.type
      const type = typeof rawType === 'string' && rawType in NODE_TYPES ? (rawType as ArchNodeType) : guessType(label)
      return { label, type }
    })
    .filter(item => item.label)
  return items.length > 0 ? items : null
}

/** Extrae los nodos definidos en un diagrama Mermaid (flowchart/graph): A[Label], B(Label), C{Label}, D((Label)), etc. */
function parseMermaidImport(text: string): ImportItem[] | null {
  const re = /([A-Za-z_][\w-]*)\s*(?:\(\(|\[\(|\[\[|\{\{|[[({>])\s*"?([^"\]})]+?)"?\s*(?:\)\)|\)\]|\]\]|\}\}|[\])}])/g
  const seen = new Map<string, string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const id = m[1]
    const label = m[2].trim()
    if (label && !seen.has(id)) seen.set(id, label)
  }
  if (seen.size === 0) return null
  return Array.from(seen.values()).map(label => ({ label, type: guessType(label) }))
}

export default function ArchitectureCanvas({ nodes, onChange }: { nodes: ArchNode[]; onChange: (nodes: ArchNode[]) => void }) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

  const addNode = (type: ArchNodeType) => {
    const idx = nodes.length
    const col = idx % 4
    const row = Math.floor(idx / 4)
    onChange([
      ...nodes,
      {
        id: makeId(),
        label: NODE_TYPES[type].label,
        type,
        x: 16 + col * (NODE_W + 16),
        y: 16 + row * (NODE_H + 16),
      },
    ])
  }

  const removeNode = (id: string) => onChange(nodes.filter(n => n.id !== id))

  const renameNode = (id: string, label: string) =>
    onChange(nodes.map(n => (n.id === id ? { ...n, label } : n)))

  const onPointerDownNode = (e: React.PointerEvent, node: ArchNode) => {
    if (editingId) return
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (!canvasRect) return
    setDragId(node.id)
    dragOffset.current = {
      x: e.clientX - canvasRect.left - node.x,
      y: e.clientY - canvasRect.top - node.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragId) return
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (!canvasRect) return
    const maxX = canvasRect.width - NODE_W
    const maxY = canvasRect.height - NODE_H
    const x = Math.min(Math.max(0, e.clientX - canvasRect.left - dragOffset.current.x), Math.max(0, maxX))
    const y = Math.min(Math.max(0, e.clientY - canvasRect.top - dragOffset.current.y), Math.max(0, maxY))
    onChange(nodes.map(n => (n.id === dragId ? { ...n, x, y } : n)))
  }, [dragId, nodes, onChange])

  const onPointerUp = () => setDragId(null)

  const handleImport = () => {
    const text = importText.trim()
    if (!text) { setImportError('Pegá un JSON o un diagrama Mermaid primero.'); return }
    const items = parseJsonImport(text) || parseMermaidImport(text)
    if (!items) {
      setImportError('No se detectaron componentes. Pegá el JSON exportado del lienzo o un diagrama Mermaid (flowchart/graph).')
      return
    }
    const startIdx = nodes.length
    const newNodes: ArchNode[] = items.map((item, i) => {
      const idx = startIdx + i
      const col = idx % 4
      const row = Math.floor(idx / 4)
      return {
        id: makeId(),
        label: item.label,
        type: item.type,
        x: 16 + col * (NODE_W + 16),
        y: 16 + row * (NODE_H + 16),
      }
    })
    onChange([...nodes, ...newNodes])
    setShowImport(false)
    setImportText('')
    setImportError('')
  }

  return (
    <div className="space-y-3">
      {/* Paleta de componentes */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(NODE_TYPES) as ArchNodeType[]).map(type => {
          const t = NODE_TYPES[type]
          return (
            <button
              key={type}
              type="button"
              onClick={() => addNode(type)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: `${t.color}1a`, border: `1px solid ${t.color}40`, color: t.color }}
            >
              <Plus size={12} />
              <t.icon size={13} />
              {t.label}
            </button>
          )
        })}
        <span className="w-px h-5 bg-gray-700" />
        <button
          type="button"
          onClick={() => { setShowImport(true); setImportError('') }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-colors"
        >
          <Upload size={12} /> Importar
        </button>
      </div>

      {/* Popup de importación: JSON propio del lienzo o diagrama Mermaid.
          Va en un portal a document.body por el mismo motivo que el popup
          del Cronograma: un ancestro con backdrop-filter/transform rompe
          el centrado de position:fixed si se renderiza en el flujo normal. */}
      {showImport && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowImport(false) }}
        >
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h3 className="text-white font-semibold text-sm">Importar arquitectura</h3>
              <button onClick={() => setShowImport(false)}
                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-gray-500 text-xs">
                Pegá el <strong className="text-gray-300">JSON</strong> exportado de otro lienzo, o un diagrama <strong className="text-gray-300">Mermaid</strong> (flowchart/graph) — se agregan como componentes nuevos al lienzo actual.
              </p>
              <textarea
                autoFocus
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={8}
                placeholder={'flowchart TD\n  A[Frontend] --> B[Backend]\n  B --> C[(Base de datos)]\n  B --> D{IA / LLM}'}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-xs font-mono leading-relaxed resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />
              {importError && <p className="text-red-400 text-xs">{importError}</p>}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowImport(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={handleImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-colors">
                  <Upload size={14} /> Importar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Lienzo */}
      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-full rounded-xl border border-gray-700 overflow-hidden select-none"
        style={{
          height: 340,
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px) 0 0 / 18px 18px, #0a0a1c',
        }}
      >
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-600 text-sm">Agrega componentes desde los botones de arriba y arrástralos al lienzo.</p>
          </div>
        )}

        {nodes.map(node => {
          const t = NODE_TYPES[node.type]
          const isEditing = editingId === node.id
          return (
            <div
              key={node.id}
              onPointerDown={e => onPointerDownNode(e, node)}
              className="absolute flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg cursor-move group"
              style={{
                left: node.x, top: node.y, width: NODE_W, height: NODE_H,
                background: 'rgba(20,20,40,0.92)',
                border: `1px solid ${t.color}55`,
                boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${t.color}22`,
                touchAction: 'none',
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${t.color}25` }}>
                <t.icon size={14} style={{ color: t.color }} />
              </div>
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    autoFocus
                    defaultValue={node.label}
                    onPointerDown={e => e.stopPropagation()}
                    onBlur={e => { renameNode(node.id, e.target.value.trim() || t.label); setEditingId(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    className="w-full bg-transparent border-b border-white/20 text-white text-xs font-medium outline-none"
                  />
                ) : (
                  <p
                    onDoubleClick={e => { e.stopPropagation(); setEditingId(node.id) }}
                    className="text-white text-xs font-medium truncate"
                    title="Doble click para renombrar"
                  >
                    {node.label}
                  </p>
                )}
                <p className="text-[10px] text-gray-500 truncate">{t.label}</p>
              </div>
              <button
                type="button"
                onPointerDown={e => e.stopPropagation()}
                onClick={() => removeNode(node.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center flex-shrink-0"
              >
                <Trash2 size={10} className="text-white" />
              </button>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-gray-600">Arrastra los componentes para ubicarlos, doble click para renombrar.</p>
    </div>
  )
}
