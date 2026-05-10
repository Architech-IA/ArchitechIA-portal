'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Search, MapPin, Star, Phone, Globe, ArrowRight,
  CheckSquare, Square, Loader2, UserPlus, AlertCircle,
  CheckCircle2, Map, X,
} from 'lucide-react'
import CategorySelector from './CategorySelector'

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })

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

interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
}

interface Props {
  onLeadsCreated?: () => void
}

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
  const [city, setCity]             = useState('')
  const [coords, setCoords]         = useState<{ lat: number; lng: number } | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSugg, setShowSugg]     = useState(false)
  const [loadingSugg, setLoadingSugg] = useState(false)
  const [category, setCategory]     = useState('')
  const [radius, setRadius]         = useState(5000)
  const [maxResults, setMaxResults] = useState(20)
  const [places, setPlaces]         = useState<Place[]>([])
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(false)
  const [converting, setConverting] = useState(false)
  const [error, setError]           = useState('')
  const [query, setQuery]           = useState('')
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showMap, setShowMap]       = useState(false)

  const suggRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeCategory = category

  // Autocomplete debounced
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (city.length < 2) { setSuggestions([]); setShowSugg(false); return }

    debounce.current = setTimeout(async () => {
      setLoadingSugg(true)
      try {
        const res = await fetch(`/api/prospecting/autocomplete?q=${encodeURIComponent(city)}`)
        const data = await res.json()
        setSuggestions(data.suggestions ?? [])
        setShowSugg(true)
      } catch { setSuggestions([]) }
      finally { setLoadingSugg(false) }
    }, 300)
  }, [city])

  // Cerrar sugerencias al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggRef.current && !suggRef.current.contains(e.target as Node)) {
        setShowSugg(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectSuggestion = (s: Suggestion) => {
    setCity(s.mainText)
    setSuggestions([])
    setShowSugg(false)
    setCoords(null) // reset coords, se geocodificará por nombre
  }

  const handleMapSelect = useCallback((lat: number, lng: number, locationName: string) => {
    setCity(locationName)
    setCoords({ lat, lng })
    setShowMap(false)
  }, [])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const search = async () => {
    if (!city.trim())        { setError('Selecciona una ubicación'); return }
    if (!activeCategory)     { setError('Ingresa una categoría'); return }
    setError('')
    setLoading(true)
    setPlaces([])
    setSelected(new Set())

    try {
      const body: Record<string, unknown> = {
        category: activeCategory,
        radius,
        maxResults,
      }
      if (coords) {
        body.lat = coords.lat
        body.lng = coords.lng
      } else {
        body.city = city
      }

      const res = await fetch('/api/prospecting/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      const msg = `${data.created} lead(s) agregados como "Identificación"${data.skipped > 0 ? ` · ${data.skipped} ya existían` : ''}`
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

      {/* Map modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
              <div>
                <h3 className="text-sm font-semibold text-white">Seleccionar ubicación en mapa</h3>
                <p className="text-xs text-gray-400 mt-0.5">Haz click en cualquier punto de Colombia</p>
              </div>
              <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="h-[500px]">
              <MapPicker onSelect={handleMapSelect} radius={radius} />
            </div>
            <div className="px-5 py-3 border-t border-gray-700 text-xs text-gray-500">
              Radio de búsqueda actual: <span className="text-orange-400 font-medium">
                {RADIUS_OPTIONS.find(r => r.value === radius)?.label ?? `${radius}m`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin size={11} /> Ubicación
            </label>
            <div className="flex gap-2">
              <div ref={suggRef} className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={city}
                  onChange={e => { setCity(e.target.value); setCoords(null) }}
                  onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                  placeholder="Busca ciudad, municipio..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                />
                {loadingSugg && (
                  <Loader2 size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                )}
                {showSugg && suggestions.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-30 overflow-hidden">
                    {suggestions.map(s => (
                      <button
                        key={s.placeId}
                        onClick={() => selectSuggestion(s)}
                        className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
                      >
                        <MapPin size={12} className="text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-white">{s.mainText}</p>
                          {s.secondaryText && (
                            <p className="text-xs text-gray-500">{s.secondaryText}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowMap(true)}
                title="Seleccionar en mapa"
                className="flex-shrink-0 p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-orange-400 hover:border-orange-500/50 transition-colors"
              >
                <Map size={16} />
              </button>
            </div>
            {coords && (
              <p className="text-[10px] text-orange-400 flex items-center gap-1">
                <MapPin size={9} /> Coordenadas seleccionadas desde mapa
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs text-gray-400">Sector y categoría</label>
            <CategorySelector value={category} onChange={setCategory} />
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
            disabled={loading || !city.trim() || !activeCategory}
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
