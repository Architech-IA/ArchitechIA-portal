'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Registro {
  id: string;
  fecha: string;           // 'YYYY-MM-DD'
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  concepto: string;
  monto: number;
  proyecto: string;
  estado: 'pagado' | 'pendiente' | 'cancelado';
  responsable: string;
}

const CATEGORIAS_INGRESO = ['Proyecto', 'Servicio', 'Consultoría', 'Licencia', 'Otro ingreso'];
const CATEGORIAS_GASTO   = ['Infraestructura Cloud', 'Herramientas y SaaS', 'Marketing', 'Operaciones', 'Nómina', 'Otros'];
const PROYECTOS = ['Agente de Seguridad AI – Cliente A', 'Automatización de Procesos – Cliente B', 'Dashboard BI – Cliente C', 'Integración n8n – Cliente D', 'Interno', 'N/A'];
const MESES_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const EMPTY_FORM = {
  fecha: new Date().toISOString().split('T')[0],
  tipo: 'ingreso' as 'ingreso' | 'gasto',
  categoria: 'Proyecto',
  concepto: '',
  monto: '',
  proyecto: 'N/A',
  estado: 'pagado' as 'pagado' | 'pendiente' | 'cancelado',
  responsable: '',
};

// ── Datos iniciales ────────────────────────────────────────────────────────────
const INITIAL_REGISTROS: Registro[] = [
  // INGRESOS
  { id:'1',  fecha:'2025-01-10', tipo:'ingreso', categoria:'Proyecto',      concepto:'Pago inicial – Agente Seguridad AI',       monto:8000,  proyecto:'Agente de Seguridad AI – Cliente A',       estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'2',  fecha:'2025-01-25', tipo:'ingreso', categoria:'Consultoría',   concepto:'Consultoría onboarding – Cliente D',        monto:4000,  proyecto:'Integración n8n – Cliente D',              estado:'pagado',    responsable:'Santiago Ortega' },
  { id:'3',  fecha:'2025-02-05', tipo:'ingreso', categoria:'Proyecto',      concepto:'Entregable fase 1 – Dashboard BI',          monto:6000,  proyecto:'Dashboard BI – Cliente C',                 estado:'pagado',    responsable:'Daniel Martínez' },
  { id:'4',  fecha:'2025-02-18', tipo:'ingreso', categoria:'Proyecto',      concepto:'Pago fase 2 – Automatización Procesos',     monto:8500,  proyecto:'Automatización de Procesos – Cliente B',   estado:'pagado',    responsable:'Santiago Ortega' },
  { id:'5',  fecha:'2025-02-28', tipo:'ingreso', categoria:'Servicio',      concepto:'Soporte mensual – Cliente A',               monto:4000,  proyecto:'Agente de Seguridad AI – Cliente A',       estado:'pagado',    responsable:'Freddy Orozco' },
  { id:'6',  fecha:'2025-03-08', tipo:'ingreso', categoria:'Proyecto',      concepto:'Entregable final – Dashboard BI',           monto:6000,  proyecto:'Dashboard BI – Cliente C',                 estado:'pagado',    responsable:'Daniel Martínez' },
  { id:'7',  fecha:'2025-03-20', tipo:'ingreso', categoria:'Consultoría',   concepto:'Consultoría estratégica – nuevo cliente',   monto:5000,  proyecto:'Interno',                                  estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'8',  fecha:'2025-03-28', tipo:'ingreso', categoria:'Servicio',      concepto:'Soporte mensual – Cliente B',               monto:4000,  proyecto:'Automatización de Procesos – Cliente B',   estado:'pagado',    responsable:'Santiago Ortega' },
  { id:'9',  fecha:'2025-04-05', tipo:'ingreso', categoria:'Proyecto',      concepto:'Pago hito – Agente Seguridad AI',           monto:7000,  proyecto:'Agente de Seguridad AI – Cliente A',       estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'10', fecha:'2025-04-12', tipo:'ingreso', categoria:'Licencia',      concepto:'Licencia anual – Cliente C',                monto:8000,  proyecto:'Dashboard BI – Cliente C',                 estado:'pagado',    responsable:'Daniel Martínez' },
  { id:'11', fecha:'2025-04-25', tipo:'ingreso', categoria:'Consultoría',   concepto:'Taller IA – empresa externa',               monto:7000,  proyecto:'Interno',                                  estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'12', fecha:'2025-05-10', tipo:'ingreso', categoria:'Proyecto',      concepto:'Entregable n8n – Cliente D',                monto:5000,  proyecto:'Integración n8n – Cliente D',              estado:'pagado',    responsable:'Freddy Orozco' },
  { id:'13', fecha:'2025-05-20', tipo:'ingreso', categoria:'Servicio',      concepto:'Soporte mensual – Clientes A y C',          monto:8000,  proyecto:'Interno',                                  estado:'pagado',    responsable:'Santiago Ortega' },
  { id:'14', fecha:'2025-05-30', tipo:'ingreso', categoria:'Consultoría',   concepto:'Diagnóstico de ciberseguridad',             monto:6500,  proyecto:'Interno',                                  estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'15', fecha:'2025-06-05', tipo:'ingreso', categoria:'Proyecto',      concepto:'Pago final – Agente Seguridad AI',          monto:12000, proyecto:'Agente de Seguridad AI – Cliente A',       estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'16', fecha:'2025-06-15', tipo:'ingreso', categoria:'Licencia',      concepto:'Licencia semestral – Cliente B',            monto:9000,  proyecto:'Automatización de Procesos – Cliente B',   estado:'pagado',    responsable:'Santiago Ortega' },
  { id:'17', fecha:'2025-06-28', tipo:'ingreso', categoria:'Consultoría',   concepto:'Consultoría expansión regional',            monto:6000,  proyecto:'Interno',                                  estado:'pendiente', responsable:'Admin ArchiTechIA' },
  // GASTOS
  { id:'18', fecha:'2025-01-05', tipo:'gasto', categoria:'Infraestructura Cloud', concepto:'Alibaba Cloud – instancias IA',       monto:1800,  proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'19', fecha:'2025-01-15', tipo:'gasto', categoria:'Herramientas y SaaS',   concepto:'n8n, Zoho Mail, Slack suscripciones', monto:600,   proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'20', fecha:'2025-01-20', tipo:'gasto', categoria:'Operaciones',           concepto:'Gastos administrativos enero',        monto:900,   proyecto:'Interno',    estado:'pagado',    responsable:'Freddy Orozco' },
  { id:'21', fecha:'2025-01-28', tipo:'gasto', categoria:'Marketing',             concepto:'Publicidad LinkedIn',                 monto:500,   proyecto:'Interno',    estado:'pagado',    responsable:'Santiago Ortega' },
  { id:'22', fecha:'2025-02-05', tipo:'gasto', categoria:'Infraestructura Cloud', concepto:'Alibaba Cloud – almacenamiento',      monto:2000,  proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'23', fecha:'2025-02-15', tipo:'gasto', categoria:'Herramientas y SaaS',   concepto:'GitHub, OpenRouter APIs',             monto:700,   proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'24', fecha:'2025-02-25', tipo:'gasto', categoria:'Operaciones',           concepto:'Servicios profesionales febrero',     monto:1200,  proyecto:'Interno',    estado:'pagado',    responsable:'Daniel Martínez' },
  { id:'25', fecha:'2025-02-28', tipo:'gasto', categoria:'Marketing',             concepto:'Diseño materiales de marca',          monto:800,   proyecto:'Interno',    estado:'pagado',    responsable:'Santiago Ortega' },
  { id:'26', fecha:'2025-03-10', tipo:'gasto', categoria:'Infraestructura Cloud', concepto:'GPU cloud – entrenamiento modelos',   monto:2200,  proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'27', fecha:'2025-03-20', tipo:'gasto', categoria:'Operaciones',           concepto:'Gastos varios marzo',                 monto:1100,  proyecto:'Interno',    estado:'pagado',    responsable:'Freddy Orozco' },
  { id:'28', fecha:'2025-04-05', tipo:'gasto', categoria:'Infraestructura Cloud', concepto:'Alibaba Cloud factura abril',         monto:2400,  proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'29', fecha:'2025-04-18', tipo:'gasto', categoria:'Herramientas y SaaS',   concepto:'Renovación herramientas SaaS',        monto:900,   proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'30', fecha:'2025-04-25', tipo:'gasto', categoria:'Marketing',             concepto:'Evento networking LATAM',             monto:700,   proyecto:'Interno',    estado:'pagado',    responsable:'Santiago Ortega' },
  { id:'31', fecha:'2025-05-08', tipo:'gasto', categoria:'Infraestructura Cloud', concepto:'Cloud compute – proyecto IA',         monto:2600,  proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'32', fecha:'2025-05-20', tipo:'gasto', categoria:'Operaciones',           concepto:'Servicios legales y contables',       monto:1400,  proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'33', fecha:'2025-05-28', tipo:'gasto', categoria:'Herramientas y SaaS',   concepto:'Licencias software desarrollo',       monto:800,   proyecto:'Interno',    estado:'pagado',    responsable:'Daniel Martínez' },
  { id:'34', fecha:'2025-06-05', tipo:'gasto', categoria:'Infraestructura Cloud', concepto:'Alibaba Cloud – escalado junio',      monto:3000,  proyecto:'Interno',    estado:'pagado',    responsable:'Admin ArchiTechIA' },
  { id:'35', fecha:'2025-06-15', tipo:'gasto', categoria:'Operaciones',           concepto:'Gastos operativos junio',             monto:1600,  proyecto:'Interno',    estado:'pagado',    responsable:'Freddy Orozco' },
  { id:'36', fecha:'2025-06-25', tipo:'gasto', categoria:'Marketing',             concepto:'Campaña redes sociales Q2',          monto:900,   proyecto:'Interno',    estado:'pendiente', responsable:'Santiago Ortega' },
];

const ESTADO_COLORS: Record<string, string> = {
  pagado:    'bg-green-900/30 text-green-400',
  pendiente: 'bg-yellow-900/30 text-yellow-400',
  cancelado: 'bg-red-900/30 text-red-400',
};

// ── Componente principal ────────────────────────────────────────────────────────
export default function FinanzasPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';

  const [registros, setRegistros]   = useState<Registro[]>(INITIAL_REGISTROS);
  const [tab, setTab]               = useState<'resumen' | 'registros'>('resumen');
  const [mesActivo, setMesActivo]   = useState(5);
  const [showModal, setShowModal]   = useState(false);
  const [editReg, setEditReg]       = useState<Registro | null>(null);
  const [confirmDel, setConfirmDel] = useState<Registro | null>(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [filtroBusq, setFiltroBusq] = useState('');

  // ── Cálculos derivados ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const solo2025 = registros.filter(r => r.fecha.startsWith('2025') && r.estado !== 'cancelado');

    const totalIngresos = solo2025.filter(r => r.tipo === 'ingreso').reduce((s, r) => s + r.monto, 0);
    const totalGastos   = solo2025.filter(r => r.tipo === 'gasto').reduce((s, r) => s + r.monto, 0);
    const utilidad      = totalIngresos - totalGastos;
    const margen        = totalIngresos > 0 ? Math.round((utilidad / totalIngresos) * 100) : 0;

    // Flujo por mes
    const ingPorMes = MESES_LABELS.map((_, i) =>
      solo2025.filter(r => r.tipo === 'ingreso' && new Date(r.fecha).getMonth() === i).reduce((s, r) => s + r.monto, 0)
    );
    const gastPorMes = MESES_LABELS.map((_, i) =>
      solo2025.filter(r => r.tipo === 'gasto' && new Date(r.fecha).getMonth() === i).reduce((s, r) => s + r.monto, 0)
    );

    // Gastos por categoría
    const catMap: Record<string, number> = {};
    solo2025.filter(r => r.tipo === 'gasto').forEach(r => {
      catMap[r.categoria] = (catMap[r.categoria] || 0) + r.monto;
    });
    const categorias = Object.entries(catMap)
      .map(([categoria, monto]) => ({ categoria, monto }))
      .sort((a, b) => b.monto - a.monto);

    // Rentabilidad por proyecto
    const proyMap: Record<string, { ingreso: number; gasto: number }> = {};
    solo2025.filter(r => r.proyecto !== 'Interno' && r.proyecto !== 'N/A').forEach(r => {
      if (!proyMap[r.proyecto]) proyMap[r.proyecto] = { ingreso: 0, gasto: 0 };
      if (r.tipo === 'ingreso') proyMap[r.proyecto].ingreso += r.monto;
      else proyMap[r.proyecto].gasto += r.monto;
    });
    const proyectos = Object.entries(proyMap).map(([nombre, v]) => ({ nombre, ...v }));

    return { totalIngresos, totalGastos, utilidad, margen, ingPorMes, gastPorMes, categorias, proyectos };
  }, [registros]);

  const mesesConDatos = MESES_LABELS.map((label, i) => ({
    label, i,
    ing: stats.ingPorMes[i],
    gast: stats.gastPorMes[i],
    activo: stats.ingPorMes[i] > 0 || stats.gastPorMes[i] > 0,
  })).filter(m => m.activo || m.i <= mesActivo);

  const maxVal = Math.max(...stats.ingPorMes, ...stats.gastPorMes, 1);

  // ── Filtros tabla ────────────────────────────────────────────────────────────
  const registrosFiltrados = useMemo(() => {
    return registros
      .filter(r => filtroTipo === 'todos' || r.tipo === filtroTipo)
      .filter(r =>
        r.concepto.toLowerCase().includes(filtroBusq.toLowerCase()) ||
        r.categoria.toLowerCase().includes(filtroBusq.toLowerCase()) ||
        r.proyecto.toLowerCase().includes(filtroBusq.toLowerCase())
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [registros, filtroTipo, filtroBusq]);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditReg(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (r: Registro) => {
    setEditReg(r);
    setFormData({ fecha: r.fecha, tipo: r.tipo, categoria: r.categoria, concepto: r.concepto, monto: String(r.monto), proyecto: r.proyecto, estado: r.estado, responsable: r.responsable });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Registro = {
      id: editReg ? editReg.id : Date.now().toString(),
      fecha: formData.fecha, tipo: formData.tipo, categoria: formData.categoria,
      concepto: formData.concepto, monto: parseFloat(formData.monto) || 0,
      proyecto: formData.proyecto, estado: formData.estado, responsable: formData.responsable,
    };
    if (editReg) {
      setRegistros(prev => prev.map(r => r.id === editReg.id ? data : r));
    } else {
      setRegistros(prev => [data, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!confirmDel) return;
    setRegistros(prev => prev.filter(r => r.id !== confirmDel.id));
    setConfirmDel(null);
  };

  const categoriasForForm = formData.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Finanzas</h1>
          <p className="text-gray-400 mt-1">Ingresos, gastos y rentabilidad de ArchiTechIA</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium">
          + Nuevo Registro
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {(['resumen', 'registros'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-orange-400 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}>
            {t === 'resumen' ? 'Resumen' : `Registros (${registros.length})`}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ──────────────────────────────────────────────────────── */}
      {tab === 'resumen' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Ingresos totales', valor: stats.totalIngresos, color: 'text-green-400',  bg: 'bg-green-900/20 border-green-800' },
              { label: 'Gastos totales',   valor: stats.totalGastos,   color: 'text-red-400',    bg: 'bg-red-900/20 border-red-800' },
              { label: 'Utilidad neta',    valor: stats.utilidad,      color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800' },
              { label: 'Margen',           valor: null,                color: 'text-blue-400',   bg: 'bg-blue-900/20 border-blue-800', extra: `${stats.margen}%` },
            ].map(k => (
              <div key={k.label} className={`rounded-xl p-5 border ${k.bg}`}>
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>
                  {k.extra ?? `$${k.valor!.toLocaleString()}`}
                </p>
              </div>
            ))}
          </div>

          {/* Gráfica de barras */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-6">Flujo de Caja — 2025</h2>
            <div className="flex items-end gap-2 md:gap-4 h-48">
              {MESES_LABELS.map((mes, i) => {
                if (stats.ingPorMes[i] === 0 && stats.gastPorMes[i] === 0) return null;
                return (
                  <div key={mes} className="flex-1 flex flex-col items-center gap-1 cursor-pointer min-w-0" onClick={() => setMesActivo(i)}>
                    <div className="w-full flex gap-0.5 md:gap-1 items-end justify-center" style={{ height: '160px' }}>
                      <div className={`flex-1 rounded-t transition-all ${i === mesActivo ? 'bg-green-400' : 'bg-green-700/60'}`}
                        style={{ height: `${(stats.ingPorMes[i] / maxVal) * 160}px` }}
                        title={`Ingreso: $${stats.ingPorMes[i].toLocaleString()}`} />
                      <div className={`flex-1 rounded-t transition-all ${i === mesActivo ? 'bg-red-400' : 'bg-red-700/60'}`}
                        style={{ height: `${(stats.gastPorMes[i] / maxVal) * 160}px` }}
                        title={`Gasto: $${stats.gastPorMes[i].toLocaleString()}`} />
                    </div>
                    <span className={`text-xs truncate ${i === mesActivo ? 'text-orange-400 font-semibold' : 'text-gray-500'}`}>{mes}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap items-center gap-4 md:gap-8 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Ingreso <span className="text-green-400 font-semibold">${stats.ingPorMes[mesActivo].toLocaleString()}</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Gasto <span className="text-red-400 font-semibold">${stats.gastPorMes[mesActivo].toLocaleString()}</span></div>
              <div className="flex items-center gap-2 md:ml-auto">Utilidad <span className="text-orange-400 font-semibold">${(stats.ingPorMes[mesActivo] - stats.gastPorMes[mesActivo]).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gastos por categoría */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Gastos por Categoría</h2>
              <div className="space-y-3">
                {stats.categorias.map(g => {
                  const pct = stats.totalGastos > 0 ? Math.round((g.monto / stats.totalGastos) * 100) : 0;
                  return (
                    <div key={g.categoria}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{g.categoria}</span>
                        <span className="text-gray-400">${g.monto.toLocaleString()} <span className="text-orange-400">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rentabilidad por proyecto */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Rentabilidad por Proyecto</h2>
              <div className="space-y-3">
                {stats.proyectos.map(p => {
                  const util = p.ingreso - p.gasto;
                  const mrg  = p.ingreso > 0 ? Math.round((util / p.ingreso) * 100) : 0;
                  return (
                    <div key={p.nombre} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                      <p className="text-sm font-medium text-white mb-1 leading-tight">{p.nombre}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>Ingreso: <span className="text-green-400">${p.ingreso.toLocaleString()}</span></span>
                        <span>Gasto: <span className="text-red-400">${p.gasto.toLocaleString()}</span></span>
                        <span>Margen: <span className="text-orange-400">{mrg}%</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: REGISTROS ────────────────────────────────────────────────────── */}
      {tab === 'registros' && (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text" placeholder="Buscar concepto, categoría, proyecto..."
              value={filtroBusq} onChange={e => setFiltroBusq(e.target.value)}
              className="flex-1 min-w-48 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
              {(['todos', 'ingreso', 'gasto'] as const).map(t => (
                <button key={t} onClick={() => setFiltroTipo(t)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors capitalize ${filtroTipo === t ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Registros</p>
              <p className="text-lg font-bold text-white">{registrosFiltrados.length}</p>
            </div>
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Ingresos</p>
              <p className="text-lg font-bold text-green-400">${registrosFiltrados.filter(r => r.tipo === 'ingreso').reduce((s, r) => s + r.monto, 0).toLocaleString()}</p>
            </div>
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Gastos</p>
              <p className="text-lg font-bold text-red-400">${registrosFiltrados.filter(r => r.tipo === 'gasto').reduce((s, r) => s + r.monto, 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Concepto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Proyecto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Responsable</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {registrosFiltrados.map(r => (
                    <tr key={r.id} className="hover:bg-gray-700/40 transition-colors">
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{r.fecha}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.tipo === 'ingreso' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {r.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{r.categoria}</td>
                      <td className="px-4 py-3 text-white max-w-xs truncate">{r.concepto}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-xs truncate whitespace-nowrap">{r.proyecto}</td>
                      <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${r.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                        {r.tipo === 'ingreso' ? '+' : '-'}${r.monto.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${ESTADO_COLORS[r.estado]}`}>{r.estado}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{r.responsable}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(r)}
                            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors">
                            Editar
                          </button>
                          {isAdmin && (
                            <button onClick={() => setConfirmDel(r)}
                              className="px-2 py-1 text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded transition-colors">
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {registrosFiltrados.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Sin registros</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Modal crear / editar ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editReg ? 'Editar Registro' : 'Nuevo Registro'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fecha</label>
                  <input required type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value as 'ingreso'|'gasto', categoria: e.target.value === 'ingreso' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_GASTO[0]})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
                    <option value="ingreso">↑ Ingreso</option>
                    <option value="gasto">↓ Gasto</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                  <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
                    {categoriasForForm.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Monto ($)</label>
                  <input required type="number" min="0" step="0.01" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Concepto</label>
                <input required type="text" value={formData.concepto} onChange={e => setFormData({...formData, concepto: e.target.value})}
                  placeholder="Descripción del movimiento"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Proyecto</label>
                  <select value={formData.proyecto} onChange={e => setFormData({...formData, proyecto: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
                    {PROYECTOS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value as 'pagado'|'pendiente'|'cancelado'})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Responsable</label>
                <input type="text" value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})}
                  placeholder="Nombre del responsable"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium">{editReg ? 'Guardar Cambios' : 'Agregar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminación ──────────────────────────────────────── */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Eliminar registro</h3>
                <p className="text-gray-400 text-sm">¿Eliminar <span className="text-white font-medium">"{confirmDel.concepto}"</span>? Esto actualizará todos los paneles.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-sm">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
