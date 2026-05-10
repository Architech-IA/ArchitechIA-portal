'use client'

import { useState } from 'react'
import { Search, MapPin, Tag, Star, Phone, Globe, ArrowRight, CheckSquare, Square, Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Place {
  placeId: string
  name: string
  address: string
  phone: string
  website: string
  rating: number | null
  totalRatings: number
  status: string
  types: string[]
}

interface Props {
  onLeadsCreated?: () => void
}

const MUNICIPIOS = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta',
  'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Pasto', 'Manizales',
  'Neiva', 'Villavicencio', 'Armenia', 'Valledupar', 'Montería', 'Sincelejo',
  'Popayán', 'Tunja', 'Florencia', 'Riohacha', 'Quibdó', 'Mocoa', 'Arauca',
  'Yopal', 'Leticia', 'San José del Guaviare', 'Puerto Carreño', 'Inírida', 'Mitú',
  'Bello', 'Itagüí', 'Envigado', 'Rionegro', 'Sabaneta', 'Copacabana',
  'Apartadó', 'Turbo', 'Caucasia', 'Caldas', 'La Estrella', 'Girardota', 'Barbosa',
  'Palmira', 'Buenaventura', 'Tuluá', 'Buga', 'Cartago', 'Jamundí',
  'Soacha', 'Zipaquirá', 'Facatativá', 'Fusagasugá', 'Girardot', 'Chía', 'Mosquera', 'Madrid',
  'Floridablanca', 'Piedecuesta', 'Barrancabermeja', 'San Gil',
  'Soledad', 'Malambo', 'Magangué',
  'Sogamoso', 'Duitama',
  'Espinal', 'Honda',
  'Tumaco', 'Lorica', 'Cereté', 'Dosquebradas',
  'Santander de Quilichao', 'Aguachica',
  'Pitalito', 'Garzón', 'Acacías', 'Maicao',
]

const CATEGORIES = [
  'Empresas de tecnología',
  'Agencias de marketing digital',
  'Constructoras',
  'Clínicas y hospitales',
  'Colegios y universidades',
  'Restaurantes y hoteles',
  'Firmas de abogados',
  'Contadores y auditores',
  'Logística y transporte',
  'Manufactura e industria',
  'Comercio al por mayor',
  'Inmobiliarias',
  'Aseguradoras',
  'ONGs y fundaciones',
]

const RADIUS_OPTIONS = [
  { value: 1000,  label: '1 km'  },
  { value: 3000,  label: '3 km'  },
  { value: 5000,  label: '5 km'  },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
]

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-gray-500">Sin calificación</span>
  return (
    <div className="flex items-center gap-1">
      <Star size={11} className="text-yellow-400 fill-yellow-400" />
      <span className="text-xs text-gray-300">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function ProspectorTab({ onLeadsCreated }: Props) {
  const [city, setCity]             = useState('Bogotá')
  const [category, setCategory]     = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [radius, setRadius]         = useState(5000)
  const [maxResults, setMaxResults] = useState(20)
  const [places, setPlaces]         = useState<Place[]>([])
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(false)
  const [converting, setConverting] = useState(false)
  const [error, setError]           = useState('')
  const [query, setQuery]           = useState('')
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const activeCategory = customCategory.trim() || category

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const search = async () => {
    if (!activeCategory) { setError('Ingresa una categoría'); return }
    setError('')
    setLoading(true)
    setPlaces([])
    setSelected(new Set())
    try {
      const res = await fetch('/api/prospecting/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, category: activeCategory, radius, maxResults }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPlaces(data.places)
      setQuery(data.query)
    } catch (e: any) {
      setError(e.message || 'Error al buscar')
    } finally {
      setLoading(false)
    }
  }

  const toggleAll = () => {
    if (selected.size === places.length) setSelected(new Set())
    else setSelected(new Set(places.map(p => p.placeId)))
  }

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const convertToLeads = async () => {
    const toConvert = places.filter(p => selected.has(p.placeId))
    if (!toConvert.length) return
    setConverting(true)
    try {
      const res = await fetch('/api/prospecting/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places: toConvert }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const msg = `${data.created} lead(s) creados con estado Identificación${data.skipped > 0 ? ` · ${data.skipped} ya existían` : ''}`
      showToast('success', msg)
      setSelected(new Set())
      onLeadsCreated?.()
    } catch (e: any) {
      showToast('error', e.message || 'Error al convertir')
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Search form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* City */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin size={11} /> Ciudad / Municipio
            </label>
            <input
              list="municipios-list"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ej: Bogotá, Bello, Palmira..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
            <datalist id="municipios-list">
              {MUNICIPIOS.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>

          {/* Category */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <Tag size={11} /> Categoría
            </label>
            <div className="flex gap-2">
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setCustomCategory('') }}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Seleccionar...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                placeholder="O escribe una..."
                value={customCategory}
                onChange={e => { setCustomCategory(e.target.value); setCategory('') }}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Radius */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Radio</label>
            <select
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
            >
              {RADIUS_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400">Máx. resultados:</label>
            {[10, 20].map(n => (
              <button
                key={n}
                onClick={() => setMaxResults(n)}
                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                  maxResults === n
                    ? 'bg-orange-600/20 border-orange-500/40 text-orange-400'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={search}
            disabled={loading || !activeCategory}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {loading ? 'Buscando...' : 'Buscar negocios'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      {/* Results */}
      {places.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-white">{places.length} resultados</span>
              <span className="text-xs text-gray-500 ml-2">"{query}"</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleAll} className="text-xs text-gray-400 hover:text-white transition-colors">
                {selected.size === places.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={convertToLeads}
                  disabled={converting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {converting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Agregar {selected.size} a Lista
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {places.map(place => (
              <div
                key={place.placeId}
                onClick={() => toggle(place.placeId)}
                className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all ${
                  selected.has(place.placeId)
                    ? 'border-orange-500/50 bg-orange-500/5'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0 text-orange-400">
                      {selected.has(place.placeId)
                        ? <CheckSquare size={16} />
                        : <Square size={16} className="text-gray-600" />
                      }
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-tight">{place.name}</h3>
                  </div>
                  <Stars rating={place.rating} />
                </div>

                <div className="ml-6 space-y-1.5">
                  {place.address && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-400">
                      <MapPin size={11} className="mt-0.5 flex-shrink-0 text-gray-600" />
                      <span className="line-clamp-2">{place.address}</span>
                    </div>
                  )}
                  {place.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Phone size={11} className="text-gray-600" />
                      <span>{place.phone}</span>
                    </div>
                  )}
                  {place.website && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Globe size={11} className="text-gray-600" />
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-orange-400 hover:underline truncate max-w-[200px]"
                      >
                        {place.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {place.types.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {place.types.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {selected.has(place.placeId) && (
                  <div className="ml-6 mt-2 flex items-center gap-1 text-[10px] text-orange-400">
                    <ArrowRight size={10} /> Se agregará a Lista como "Identificación"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && places.length === 0 && query && (
        <div className="text-center py-16 text-gray-600">
          <Search size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Sin resultados para "{query}"</p>
          <p className="text-xs mt-1">Prueba con otro término o amplía el radio</p>
        </div>
      )}
    </div>
  )
}
