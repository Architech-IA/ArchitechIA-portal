'use client'

import Link from 'next/link'
import {
  FlaskConical, CheckCircle2, ArrowRight, Zap, Gauge,
  Target, ShieldCheck, FileText, MessageSquare,
} from 'lucide-react'

const benefits = [
  {
    icon: FlaskConical,
    title: 'Validación técnica',
    desc: 'Comprobamos que la tecnología elegida resuelve el caso de uso antes de invertir en desarrollo completo.',
  },
  {
    icon: Gauge,
    title: 'Rápido y enfocado',
    desc: 'PoC de 2 a 6 semanas con un alcance reducido y métricas claras de éxito.',
  },
  {
    icon: Target,
    title: 'Medición de impacto',
    desc: 'Definimos KPIs concretos para demostrar ROI y tomar decisiones con datos.',
  },
  {
    icon: ShieldCheck,
    title: 'Reducción de riesgo',
    desc: 'Identificamos limitaciones técnicas, costos reales y ajustes necesarios a tiempo.',
  },
]

const deliverables = [
  { title: 'Demo funcional', desc: 'Un prototipo ejecutable del caso de uso prioritario.' },
  { title: 'Informe técnico', desc: 'Arquitectura, stack, limitaciones y recomendaciones.' },
  { title: 'Propuesta de escala', desc: 'Roadmap y estimación para llevar el PoC a producción.' },
  { title: 'KPIs validados', desc: 'Resultados medibles contra los objetivos definidos.' },
]

export default function PocSolutionPage() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-cyan-700 to-blue-700 p-8 md:p-10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium mb-4">
            <FlaskConical size={14} />
            Prueba de concepto
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">PoC</h1>
          <p className="text-white/90 text-lg leading-relaxed max-w-2xl">
            Proof of Concept para validar una idea, tecnología o caso de uso de IA antes de escalar.
            Reduce el riesgo y toma decisiones informadas con un demo funcional y métricas reales.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/leads"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-cyan-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              <MessageSquare size={16} />
              Cotizar un PoC
            </Link>
            <Link
              href="/proposals"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white rounded-lg text-sm font-medium hover:bg-white/25 transition-colors"
            >
              <FileText size={16} />
              Ver propuestas
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map(b => (
          <div
            key={b.title}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-cyan-500/30 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-600/15 flex items-center justify-center flex-shrink-0">
                <b.icon className="text-cyan-400" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">{b.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6">Metodología del PoC</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Definición', desc: 'Seleccionamos el caso de uso, datos disponibles y criterios de éxito.' },
            { step: '02', title: 'Diseño', desc: 'Diseñamos el experimento mínimo viable y la arquitectura técnica.' },
            { step: '03', title: 'Implementación', desc: 'Construimos el demo funcional en tiempo record.' },
            { step: '04', title: 'Validación', desc: 'Medimos resultados y entregamos recomendación de go/no-go.' },
          ].map((p, idx, arr) => (
            <div key={p.step} className="relative">
              {idx < arr.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
              )}
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 rounded-full bg-cyan-600/15 text-cyan-400 font-bold flex items-center justify-center border border-cyan-500/20">
                  {p.step}
                </span>
                <ArrowRight className="text-gray-600 lg:hidden" size={16} />
              </div>
              <h3 className="text-white font-semibold mb-1">{p.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deliverables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliverables.map(d => (
          <div key={d.title} className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <CheckCircle2 className="text-cyan-400 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <h3 className="text-white font-medium mb-1">{d.title}</h3>
              <p className="text-gray-400 text-sm">{d.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Zap className="text-cyan-400" size={22} />
            ¿Quieres validar una idea antes de invertir?
          </h2>
          <p className="text-gray-400 text-sm">Un PoC es la forma más segura de probar el valor de la IA en tu negocio.</p>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Empezar un PoC
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
