'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type NodeCat = 'trigger' | 'source' | 'transform' | 'condition' | 'action' | 'output';

interface NodeTemplate {
  id: string; label: string; cat: NodeCat;
  color: string; bg: string; desc: string;
  hasInput: boolean; outs: string[];
}
interface WFNode { id: string; tpl: string; label: string; x: number; y: number; }
interface WFEdge { id: string; fromId: string; fromPort: string; toId: string; }

/* ─── Templates ─────────────────────────────────────────────────────────────── */
const TEMPLATES: NodeTemplate[] = [
  { id: 'trig-cron',    label: 'Cron Schedule', cat: 'trigger',   color: '#f97316', bg: 'rgba(249,115,22,0.10)', desc: 'Horario recurrente',     hasInput: false, outs: ['out'] },
  { id: 'trig-webhook', label: 'Webhook',        cat: 'trigger',   color: '#f97316', bg: 'rgba(249,115,22,0.10)', desc: 'Recibir petición HTTP',   hasInput: false, outs: ['out'] },
  { id: 'trig-manual',  label: 'Manual',         cat: 'trigger',   color: '#f97316', bg: 'rgba(249,115,22,0.10)', desc: 'Ejecutar manualmente',    hasInput: false, outs: ['out'] },
  { id: 'trig-event',   label: 'Event',          cat: 'trigger',   color: '#f97316', bg: 'rgba(249,115,22,0.10)', desc: 'Evento del sistema',      hasInput: false, outs: ['out'] },
  { id: 'src-http',     label: 'HTTP Request',   cat: 'source',    color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', desc: 'Consultar API externa',   hasInput: true,  outs: ['out'] },
  { id: 'src-db',       label: 'Query DB',       cat: 'source',    color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', desc: 'Leer de base de datos',   hasInput: true,  outs: ['out'] },
  { id: 'src-file',     label: 'Read File',      cat: 'source',    color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', desc: 'Leer archivo CSV / JSON', hasInput: true,  outs: ['out'] },
  { id: 'tr-map',       label: 'Map / Shape',    cat: 'transform', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', desc: 'Transformar campos',     hasInput: true,  outs: ['out'] },
  { id: 'tr-filter',    label: 'Filter',         cat: 'transform', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', desc: 'Filtrar registros',      hasInput: true,  outs: ['out'] },
  { id: 'tr-agg',       label: 'Aggregate',      cat: 'transform', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', desc: 'Agrupar y calcular',     hasInput: true,  outs: ['out'] },
  { id: 'tr-merge',     label: 'Merge',          cat: 'transform', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', desc: 'Combinar dos streams',   hasInput: true,  outs: ['out'] },
  { id: 'tr-split',     label: 'Split / Batch',  cat: 'transform', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', desc: 'Dividir en lotes',       hasInput: true,  outs: ['out'] },
  { id: 'cond-if',      label: 'If / Else',      cat: 'condition', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', desc: 'Bifurcar por condición',  hasInput: true,  outs: ['true', 'false'] },
  { id: 'cond-switch',  label: 'Switch',         cat: 'condition', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', desc: 'Múltiples ramas',         hasInput: true,  outs: ['out'] },
  { id: 'act-email',    label: 'Send Email',     cat: 'action',    color: '#34d399', bg: 'rgba(52,211,153,0.10)', desc: 'Enviar correo',           hasInput: true,  outs: ['out'] },
  { id: 'act-slack',    label: 'Slack Message',  cat: 'action',    color: '#34d399', bg: 'rgba(52,211,153,0.10)', desc: 'Mensaje en Slack',        hasInput: true,  outs: ['out'] },
  { id: 'act-http',     label: 'HTTP POST',      cat: 'action',    color: '#34d399', bg: 'rgba(52,211,153,0.10)', desc: 'Enviar datos a API',      hasInput: true,  outs: ['out'] },
  { id: 'act-code',     label: 'Run Script',     cat: 'action',    color: '#34d399', bg: 'rgba(52,211,153,0.10)', desc: 'Ejecutar código JS',      hasInput: true,  outs: ['out'] },
  { id: 'out-db',       label: 'Write to DB',    cat: 'output',    color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', desc: 'Guardar en base de datos', hasInput: true, outs: [] },
  { id: 'out-file',     label: 'Export File',    cat: 'output',    color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', desc: 'Exportar CSV / JSON',     hasInput: true,  outs: [] },
  { id: 'out-notif',    label: 'Notification',   cat: 'output',    color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', desc: 'Enviar notificación',     hasInput: true,  outs: [] },
];

const CAT_LABELS: Record<NodeCat, string> = {
  trigger: 'Disparadores', source: 'Fuentes', transform: 'Transformación',
  condition: 'Condición', action: 'Acciones', output: 'Salida',
};

/* ─── Canvas constants ──────────────────────────────────────────────────────── */
const NW = 200;
const NH = 80;

/* ─── Shared styles ─────────────────────────────────────────────────────────── */
const inputSt: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px', padding: '6px 10px', color: '#e2e8f0', fontSize: '12px',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};
const labelSt: React.CSSProperties  = { fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px' };
const fieldSt: React.CSSProperties  = { marginBottom: '10px' };
const btnCtrl: React.CSSProperties  = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px' };

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
let _uid = 1;
const uid = () => `n${_uid++}`;

function outPortY(port: string, outs: string[]) {
  if (outs.length === 1) return NH / 2;
  return ((outs.indexOf(port) + 1) * NH) / (outs.length + 1);
}

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = Math.max(Math.abs(x2 - x1) * 0.45, 70);
  return `M${x1},${y1} C${x1 + cx},${y1} ${x2 - cx},${y2} ${x2},${y2}`;
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function WorkflowsPage() {
  const [nodes,    setNodes]    = useState<WFNode[]>([]);
  const [edges,    setEdges]    = useState<WFEdge[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [pan,      setPan]      = useState({ x: 140, y: 90 });
  const [zoom,     setZoom]     = useState(1);
  const [panning,  setPanning]  = useState(false);
  const [conn,     setConn]     = useState<{ fromId: string; fromPort: string; mx: number; my: number } | null>(null);

  const canvasRef   = useRef<HTMLDivElement>(null);
  const dragNodeRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const panRef      = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const screenToCanvas = (sx: number, sy: number) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (sx - r.left - pan.x) / zoom, y: (sy - r.top - pan.y) / zoom };
  };

  const canvasToScreen = useCallback(
    (cx: number, cy: number) => ({ x: cx * zoom + pan.x, y: cy * zoom + pan.y }),
    [pan, zoom],
  );

  /* Drop from palette */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tplId = e.dataTransfer.getData('tplId');
    const tpl = TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    const c = screenToCanvas(e.clientX, e.clientY);
    setNodes(p => [...p, { id: uid(), tpl: tplId, label: tpl.label, x: c.x - NW / 2, y: c.y - NH / 2 }]);
  };

  /* Canvas pan start */
  const onCanvasDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]') || (e.target as HTMLElement).closest('[data-port]')) return;
    setSelected(null);
    panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
    setPanning(true);
  };

  /* Mouse move — pan / drag node / track pending edge */
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (panRef.current) {
      setPan({ x: panRef.current.ox + (e.clientX - panRef.current.sx), y: panRef.current.oy + (e.clientY - panRef.current.sy) });
    }
    if (dragNodeRef.current) {
      const dx = (e.clientX - dragNodeRef.current.sx) / zoom;
      const dy = (e.clientY - dragNodeRef.current.sy) / zoom;
      const id = dragNodeRef.current.id;
      setNodes(p => p.map(n => n.id === id ? { ...n, x: dragNodeRef.current!.ox + dx, y: dragNodeRef.current!.oy + dy } : n));
    }
    if (conn) {
      const r = canvasRef.current!.getBoundingClientRect();
      setConn(p => p ? { ...p, mx: e.clientX - r.left, my: e.clientY - r.top } : null);
    }
  }, [zoom, conn]);

  const onMouseUp = () => {
    panRef.current = null;
    dragNodeRef.current = null;
    setPanning(false);
    if (conn) setConn(null);
  };

  /* Scroll to zoom */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.12 : 0.9;
    const r = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    setZoom(z => {
      const nz = Math.min(2.5, Math.max(0.2, z * f));
      setPan(p => ({ x: mx - (mx - p.x) * nz / z, y: my - (my - p.y) * nz / z }));
      return nz;
    });
  };

  /* Delete selected node */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !(e.target as HTMLElement).matches('input,textarea,select')) {
        setNodes(p => p.filter(n => n.id !== selected));
        setEdges(p => p.filter(ed => ed.fromId !== selected && ed.toId !== selected));
        setSelected(null);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selected]);

  /* Start a connection from output port */
  const startConn = (e: React.MouseEvent, fromId: string, fromPort: string) => {
    e.stopPropagation();
    const r = canvasRef.current!.getBoundingClientRect();
    setConn({ fromId, fromPort, mx: e.clientX - r.left, my: e.clientY - r.top });
  };

  /* Complete a connection on input port */
  const endConn = (e: React.MouseEvent, toId: string) => {
    e.stopPropagation();
    if (conn && conn.fromId !== toId) {
      const dup = edges.some(ed => ed.fromId === conn.fromId && ed.fromPort === conn.fromPort && ed.toId === toId);
      if (!dup) setEdges(p => [...p, { id: uid(), fromId: conn.fromId, fromPort: conn.fromPort, toId }]);
    }
    setConn(null);
  };

  /* Start dragging a node */
  const startNodeDrag = (e: React.MouseEvent, node: WFNode) => {
    e.stopPropagation();
    setSelected(node.id);
    dragNodeRef.current = { id: node.id, sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y };
  };

  /* Compute edge SVG paths */
  const edgePaths = edges
    .map(edge => {
      const from = nodes.find(n => n.id === edge.fromId);
      const to   = nodes.find(n => n.id === edge.toId);
      if (!from || !to) return null;
      const ft = TEMPLATES.find(t => t.id === from.tpl)!;
      const py = outPortY(edge.fromPort, ft.outs);
      const fs = canvasToScreen(from.x + NW, from.y + py);
      const ts = canvasToScreen(to.x,        to.y + NH / 2);
      return { ...edge, path: bezier(fs.x, fs.y, ts.x, ts.y), color: ft.color };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  /* Pending connection path */
  let pendingPath: string | null = null;
  if (conn) {
    const from = nodes.find(n => n.id === conn.fromId);
    if (from) {
      const ft = TEMPLATES.find(t => t.id === from.tpl)!;
      const py = outPortY(conn.fromPort, ft.outs);
      const fs = canvasToScreen(from.x + NW, from.y + py);
      pendingPath = bezier(fs.x, fs.y, conn.mx, conn.my);
    }
  }

  const selNode = selected ? nodes.find(n => n.id === selected) : null;
  const selTpl  = selNode  ? TEMPLATES.find(t => t.id === selNode.tpl) : null;
  const cats    = [...new Set(TEMPLATES.map(t => t.cat))] as NodeCat[];

  return (
    <div style={{ height: 'calc(100vh - 52px)', display: 'flex', overflow: 'hidden', fontFamily: 'var(--font-inter), Inter, sans-serif', background: '#070716' }}>

      {/* ── LEFT: PALETTE ── */}
      <aside style={{ width: '216px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,8,26,0.98)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Paleta de Nodos</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {cats.map(cat => (
            <div key={cat} style={{ marginBottom: '10px' }}>
              <p style={{ margin: '0 0 4px 6px', fontSize: '9px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {CAT_LABELS[cat]}
              </p>
              {TEMPLATES.filter(t => t.cat === cat).map(tpl => (
                <div
                  key={tpl.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('tplId', tpl.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', marginBottom: '2px', border: `1px solid ${tpl.color}22`, background: tpl.bg, cursor: 'grab', userSelect: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = tpl.color + '22'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = tpl.bg}
                >
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: tpl.color, flexShrink: 0, boxShadow: `0 0 5px ${tpl.color}80` }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#cbd5e1', lineHeight: 1.3 }}>{tpl.label}</p>
                    <p style={{ margin: 0, fontSize: '9px', color: '#475569', lineHeight: 1.3 }}>{tpl.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* ── CENTER: CANVAS ── */}
      <div
        ref={canvasRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#070716', cursor: panning ? 'grabbing' : conn ? 'crosshair' : 'default' }}
        onMouseDown={onCanvasDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
      >
        {/* Grid dots */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="wf-grid" x={pan.x % (24 * zoom)} y={pan.y % (24 * zoom)} width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse">
              <circle cx={1} cy={1} r={0.9} fill="rgba(255,255,255,0.07)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wf-grid)" />
        </svg>

        {/* SVG edges overlay */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          {edgePaths.map(ep => (
            <g key={ep.id}>
              <path d={ep.path} stroke={ep.color} strokeWidth={8}   fill="none" opacity={0.12} strokeLinecap="round" />
              <path d={ep.path} stroke={ep.color} strokeWidth={2.5} fill="none" opacity={0.8}  strokeLinecap="round" />
            </g>
          ))}
          {pendingPath && (
            <path d={pendingPath} stroke="rgba(255,255,255,0.4)" strokeWidth={2} fill="none" strokeDasharray="6 4" strokeLinecap="round" />
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const tpl  = TEMPLATES.find(t => t.id === node.tpl)!;
          const sx   = node.x * zoom + pan.x;
          const sy   = node.y * zoom + pan.y;
          const isSel = selected === node.id;
          const w    = NW * zoom;
          const h    = NH * zoom;
          const r    = 10 * zoom;

          return (
            <div
              key={node.id}
              data-node
              onMouseDown={e => startNodeDrag(e, node)}
              style={{ position: 'absolute', left: sx, top: sy, width: w, height: h, cursor: 'grab', zIndex: isSel ? 10 : 1, userSelect: 'none' }}
            >
              {/* Input port */}
              {tpl.hasInput && (
                <div
                  data-port
                  onMouseUp={e => endConn(e, node.id)}
                  style={{ position: 'absolute', left: -6 * zoom, top: (NH / 2 - 6) * zoom, width: 12 * zoom, height: 12 * zoom, borderRadius: '50%', background: '#0d0d1f', border: `2px solid ${tpl.color}`, cursor: conn ? 'cell' : 'default', pointerEvents: 'all', zIndex: 20 }}
                />
              )}

              {/* Card */}
              <div style={{ width: '100%', height: '100%', borderRadius: r, background: 'rgba(11,11,27,0.97)', border: `${isSel ? 1.5 : 1}px solid ${isSel ? tpl.color : 'rgba(255,255,255,0.09)'}`, boxShadow: isSel ? `0 0 0 2px ${tpl.color}28, 0 8px 32px rgba(0,0,0,0.7)` : '0 4px 20px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                {/* Category stripe */}
                <div style={{ height: 22 * zoom, background: tpl.bg, borderBottom: `1px solid ${tpl.color}22`, display: 'flex', alignItems: 'center', paddingLeft: 10 * zoom, gap: 6 * zoom }}>
                  <div style={{ width: 6 * zoom, height: 6 * zoom, borderRadius: '50%', background: tpl.color, boxShadow: `0 0 4px ${tpl.color}` }} />
                  <span style={{ fontSize: 8.5 * zoom, fontWeight: 700, color: tpl.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{CAT_LABELS[tpl.cat]}</span>
                </div>
                {/* Body */}
                <div style={{ padding: `${7 * zoom}px ${10 * zoom}px` }}>
                  <p style={{ margin: 0, fontSize: 11.5 * zoom, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>{node.label}</p>
                  <p style={{ margin: `${2 * zoom}px 0 0`, fontSize: 9.5 * zoom, color: '#475569', lineHeight: 1.3 }}>{tpl.desc}</p>
                </div>
              </div>

              {/* Output ports */}
              {tpl.outs.map(portName => {
                const py = outPortY(portName, tpl.outs);
                return (
                  <div
                    key={portName}
                    data-port
                    onMouseDown={e => startConn(e, node.id, portName)}
                    style={{ position: 'absolute', right: -6 * zoom, top: (py - 6) * zoom, width: 12 * zoom, height: 12 * zoom, borderRadius: '50%', background: tpl.color, border: '2px solid rgba(0,0,0,0.4)', cursor: 'crosshair', pointerEvents: 'all', zIndex: 20, boxShadow: `0 0 7px ${tpl.color}80` }}
                  />
                );
              })}

              {/* TRUE / FALSE labels for condition nodes */}
              {tpl.outs.length === 2 && tpl.outs.map(portName => {
                const py = outPortY(portName, tpl.outs);
                return (
                  <div
                    key={`lbl-${portName}`}
                    style={{ position: 'absolute', right: 16 * zoom, top: (py - 8) * zoom, fontSize: 8.5 * zoom, fontWeight: 700, color: portName === 'true' ? '#22c55e' : '#f87171', pointerEvents: 'none' }}
                  >
                    {portName.toUpperCase()}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: '14px' }}>
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <rect x="4"  y="22" width="18" height="16" rx="4" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
              <rect x="38" y="22" width="18" height="16" rx="4" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
              <line x1="22" y1="30" x2="38" y2="30" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="3 3"/>
              <circle cx="38" cy="30" r="3" fill="rgba(255,255,255,0.15)"/>
            </svg>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: 500, margin: '0 0 4px' }}>Arrastrá un nodo desde la paleta para comenzar</p>
              <p style={{ color: 'rgba(255,255,255,0.1)', fontSize: '11px', margin: 0 }}>Conectá los puertos para definir el flujo · Scroll para hacer zoom</p>
            </div>
          </div>
        )}

        {/* Top-right toolbar */}
        <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selNode && (
            <button
              onClick={() => {
                setNodes(p => p.filter(n => n.id !== selected));
                setEdges(p => p.filter(ed => ed.fromId !== selected && ed.toId !== selected));
                setSelected(null);
              }}
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '5px 12px', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}
            >
              Eliminar nodo
            </button>
          )}
          <div style={{ background: 'rgba(8,8,26,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px 10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setZoom(z => Math.min(2.5, z * 1.2))} style={btnCtrl}>+</button>
            <span style={{ fontSize: '11px', color: '#475569', minWidth: '38px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.2, z * 0.85))} style={btnCtrl}>−</button>
          </div>
          <button
            onClick={() => { setPan({ x: 140, y: 90 }); setZoom(1); }}
            style={{ background: 'rgba(8,8,26,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '5px 12px', color: '#475569', fontSize: '11px', cursor: 'pointer' }}
          >
            ↺ Reset
          </button>
        </div>

        {/* Bottom-right run / clear */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setNodes([]); setEdges([]); setSelected(null); }}
            style={{ background: 'rgba(8,8,26,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 14px', color: '#475569', fontSize: '12px', cursor: 'pointer' }}
          >
            Limpiar
          </button>
          <button
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: '8px', padding: '7px 18px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            Ejecutar Workflow
          </button>
        </div>

        {/* Bottom-left stats */}
        {nodes.length > 0 && (
          <div style={{ position: 'absolute', bottom: 16, left: 14, background: 'rgba(8,8,26,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '5px 12px', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#475569' }}>{nodes.length} nodo{nodes.length !== 1 ? 's' : ''}</span>
            <span style={{ fontSize: '11px', color: '#1e293b' }}>·</span>
            <span style={{ fontSize: '11px', color: '#475569' }}>{edges.length} conexión{edges.length !== 1 ? 'es' : ''}</span>
          </div>
        )}
      </div>

      {/* ── RIGHT: PROPERTIES PANEL ── */}
      {selNode && selTpl && (
        <aside style={{ width: '264px', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,8,26,0.98)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: selTpl.color, boxShadow: `0 0 6px ${selTpl.color}` }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{selNode.label}</p>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>{selTpl.desc}</p>
          </div>

          {/* Config fields */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Configuración</p>
            <ConfigFields tpl={selTpl} />
          </div>

          {/* Connections list */}
          <div style={{ padding: '14px 16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Conexiones</p>
            {edges
              .filter(e => e.fromId === selNode.id || e.toId === selNode.id)
              .map(e => {
                const isOut = e.fromId === selNode.id;
                const other = nodes.find(n => n.id === (isOut ? e.toId : e.fromId));
                const oTpl  = other ? TEMPLATES.find(t => t.id === other.tpl) : null;
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', padding: '5px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '12px', color: isOut ? selTpl.color : '#64748b' }}>{isOut ? '→' : '←'}</span>
                    {oTpl && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: oTpl.color, flexShrink: 0 }} />}
                    <span style={{ fontSize: '11px', color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.label}</span>
                    {e.fromPort !== 'out' && (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: e.fromPort === 'true' ? '#22c55e' : '#f87171' }}>{e.fromPort.toUpperCase()}</span>
                    )}
                    <button onClick={() => setEdges(p => p.filter(ed => ed.id !== e.id))} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '14px', padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                );
              })
            }
            {edges.filter(e => e.fromId === selNode.id || e.toId === selNode.id).length === 0 && (
              <p style={{ margin: 0, fontSize: '11px', color: '#1e293b' }}>Sin conexiones aún</p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

/* ─── Config fields per node type ───────────────────────────────────────────── */
function ConfigFields({ tpl }: { tpl: NodeTemplate }) {
  const sel = { ...inputSt } as React.CSSProperties;

  if (tpl.id === 'trig-cron') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>Expresión Cron</label><input style={{ ...inputSt, fontFamily: 'monospace' }} defaultValue="0 9 * * 1-5" /></div>
      <div style={fieldSt}><label style={labelSt}>Zona horaria</label><input style={inputSt} defaultValue="America/Bogota" /></div>
      <p style={{ margin: '6px 0 0', fontSize: '10px', color: '#334155' }}>Lun–Vie a las 09:00</p>
    </div>
  );

  if (tpl.id === 'trig-webhook') return (
    <div>
      <div style={fieldSt}>
        <label style={labelSt}>Método HTTP</label>
        <select style={sel}><option>POST</option><option>GET</option><option>PUT</option></select>
      </div>
      <div style={{ ...fieldSt, background: 'rgba(56,189,248,0.07)', borderRadius: '6px', padding: '8px 10px' }}>
        <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>Endpoint generado:</p>
        <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>/api/wf/hook/auto-xxxx</p>
      </div>
    </div>
  );

  if (tpl.id === 'trig-manual') return (
    <div style={fieldSt}><label style={labelSt}>Nombre del workflow</label><input style={inputSt} placeholder="Mi Proceso" /></div>
  );

  if (tpl.id === 'trig-event') return (
    <div style={fieldSt}>
      <label style={labelSt}>Evento del sistema</label>
      <select style={sel}><option>lead.created</option><option>proposal.accepted</option><option>project.completed</option><option>payment.received</option></select>
    </div>
  );

  if (tpl.id === 'src-http') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>URL</label><input style={inputSt} placeholder="https://api.ejemplo.com/v1/data" /></div>
      <div style={fieldSt}>
        <label style={labelSt}>Método</label>
        <select style={sel}><option>GET</option><option>POST</option><option>PUT</option></select>
      </div>
      <div style={fieldSt}><label style={labelSt}>Headers (JSON)</label><textarea rows={2} style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }} placeholder={'{ "Authorization": "Bearer ..." }'} /></div>
    </div>
  );

  if (tpl.id === 'src-db') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>Tabla</label><input style={{ ...inputSt, fontFamily: 'monospace' }} placeholder="nombre_tabla" /></div>
      <div style={fieldSt}><label style={labelSt}>Filtro SQL (WHERE)</label><textarea rows={2} style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }} placeholder="estado = 'activo' AND fecha > NOW()" /></div>
      <div style={fieldSt}><label style={labelSt}>Límite de filas</label><input style={inputSt} type="number" defaultValue="1000" /></div>
    </div>
  );

  if (tpl.id === 'src-file') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>Ruta del archivo</label><input style={{ ...inputSt, fontFamily: 'monospace' }} placeholder="/data/input.csv" /></div>
      <div style={fieldSt}>
        <label style={labelSt}>Formato</label>
        <select style={sel}><option>CSV</option><option>JSON</option><option>Excel</option></select>
      </div>
    </div>
  );

  if (tpl.id === 'tr-map') return (
    <div>
      <div style={fieldSt}>
        <label style={labelSt}>Expresión de transformación (JS)</label>
        <textarea rows={5} style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }} defaultValue={"item => ({\n  ...item,\n  updatedAt: new Date().toISOString()\n})"} />
      </div>
    </div>
  );

  if (tpl.id === 'tr-filter') return (
    <div>
      <div style={fieldSt}>
        <label style={labelSt}>Condición (JS — retornar true para conservar)</label>
        <textarea rows={3} style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }} defaultValue={"item => item.activo === true"} />
      </div>
    </div>
  );

  if (tpl.id === 'tr-agg') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>Agrupar por campo</label><input style={{ ...inputSt, fontFamily: 'monospace' }} placeholder="categoria" /></div>
      <div style={fieldSt}>
        <label style={labelSt}>Operación</label>
        <select style={sel}><option>COUNT</option><option>SUM</option><option>AVG</option><option>MAX</option><option>MIN</option></select>
      </div>
      <div style={fieldSt}><label style={labelSt}>Campo de valor</label><input style={{ ...inputSt, fontFamily: 'monospace' }} placeholder="monto" /></div>
    </div>
  );

  if (tpl.id === 'tr-merge') return (
    <div>
      <div style={fieldSt}>
        <label style={labelSt}>Estrategia</label>
        <select style={sel}><option>Concat (append)</option><option>Zip (paralelo)</option><option>Join por clave</option></select>
      </div>
      <div style={fieldSt}><label style={labelSt}>Clave de join (si aplica)</label><input style={{ ...inputSt, fontFamily: 'monospace' }} placeholder="id" /></div>
    </div>
  );

  if (tpl.id === 'tr-split') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>Tamaño de lote</label><input style={inputSt} type="number" defaultValue="100" /></div>
    </div>
  );

  if (tpl.id === 'cond-if') return (
    <div>
      <div style={fieldSt}>
        <label style={labelSt}>Condición (JS)</label>
        <textarea rows={3} style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }} defaultValue={"item.valor > 1000"} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '10px', color: '#22c55e', fontWeight: 700, textAlign: 'center' }}>TRUE →</div>
        <div style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: '10px', color: '#f87171', fontWeight: 700, textAlign: 'center' }}>FALSE →</div>
      </div>
    </div>
  );

  if (tpl.id === 'cond-switch') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>Campo a evaluar</label><input style={{ ...inputSt, fontFamily: 'monospace' }} placeholder="item.estado" /></div>
      <div style={fieldSt}><label style={labelSt}>Casos (uno por línea)</label><textarea rows={4} style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }} placeholder={"activo\npendiente\ncerrado"} /></div>
    </div>
  );

  if (tpl.id === 'act-email') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>Para</label><input style={inputSt} placeholder="destino@empresa.com" /></div>
      <div style={fieldSt}><label style={labelSt}>Asunto</label><input style={inputSt} placeholder="Notificación de workflow" /></div>
      <div style={fieldSt}><label style={labelSt}>Cuerpo</label><textarea rows={3} style={{ ...inputSt, resize: 'vertical' }} placeholder="Hola, el proceso se completó correctamente." /></div>
    </div>
  );

  if (tpl.id === 'act-slack') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>Canal</label><input style={inputSt} placeholder="#general" /></div>
      <div style={fieldSt}><label style={labelSt}>Mensaje</label><textarea rows={3} style={{ ...inputSt, resize: 'vertical' }} placeholder="✅ Proceso completado con {{count}} registros." /></div>
    </div>
  );

  if (tpl.id === 'act-http') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>URL</label><input style={inputSt} placeholder="https://webhook.site/..." /></div>
      <div style={fieldSt}><label style={labelSt}>Body (JSON)</label><textarea rows={3} style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }} placeholder={'{ "data": "{{item}}" }'} /></div>
    </div>
  );

  if (tpl.id === 'act-code') return (
    <div>
      <div style={fieldSt}>
        <label style={labelSt}>Script JS (recibe `item`, retornar resultado)</label>
        <textarea rows={7} style={{ ...inputSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }} defaultValue={"// item es el objeto actual del pipeline\nconst result = {\n  ...item,\n  procesado: true,\n};\nreturn result;"} />
      </div>
    </div>
  );

  if (tpl.id === 'out-db') return (
    <div>
      <div style={fieldSt}><label style={labelSt}>Tabla destino</label><input style={{ ...inputSt, fontFamily: 'monospace' }} placeholder="tabla_destino" /></div>
      <div style={fieldSt}>
        <label style={labelSt}>Operación</label>
        <select style={sel}><option>INSERT</option><option>UPSERT</option><option>UPDATE</option></select>
      </div>
      <div style={fieldSt}><label style={labelSt}>Clave de conflicto (UPSERT)</label><input style={{ ...inputSt, fontFamily: 'monospace' }} placeholder="id" /></div>
    </div>
  );

  if (tpl.id === 'out-file') return (
    <div>
      <div style={fieldSt}>
        <label style={labelSt}>Formato</label>
        <select style={sel}><option>CSV</option><option>JSON</option><option>Excel (.xlsx)</option></select>
      </div>
      <div style={fieldSt}><label style={labelSt}>Nombre del archivo</label><input style={inputSt} placeholder="export-{{date}}.csv" /></div>
      <div style={fieldSt}><label style={labelSt}>Ruta de salida</label><input style={{ ...inputSt, fontFamily: 'monospace' }} placeholder="/exports/" /></div>
    </div>
  );

  if (tpl.id === 'out-notif') return (
    <div>
      <div style={fieldSt}>
        <label style={labelSt}>Canal</label>
        <select style={sel}><option>In-app</option><option>Email</option><option>Slack</option></select>
      </div>
      <div style={fieldSt}><label style={labelSt}>Mensaje</label><textarea rows={2} style={{ ...inputSt, resize: 'vertical' }} placeholder="Workflow completado correctamente." /></div>
    </div>
  );

  return <p style={{ margin: 0, fontSize: '11px', color: '#334155' }}>Sin configuración adicional.</p>;
}
