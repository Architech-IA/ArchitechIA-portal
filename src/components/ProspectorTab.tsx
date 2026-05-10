'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import {
  Search, MapPin, Star, Phone, Globe, ArrowRight,
  CheckSquare, Square, Loader2, UserPlus, AlertCircle,
  CheckCircle2, Map, X, Table2, Trash2, ExternalLink,
  RefreshCw,
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
  initialView?: 'search' | 'table'
}

interface SavedResult {
  id: string
  placeId: string
  name: string
  address: string | null
  phone: string | null
  website: string | null
  rating: number | null
  totalRatings: number
  types: string | null
  city: string
  category: string
  convertedToLead: boolean
  savedByName: string
  createdAt: string
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

export default function ProspectorTab({ onLeadsCreated, initialView = 'search' }: Props) {
  const [city, setCity]             = useState('')
  const [coords, setCoords]         = useState<{ lat: number; lng: number } | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSugg, setShowSugg]     = useState(false)
  const [loadingSugg, setLoadingSugg] = useState(false)
  const [category, setCategory]     = useState('')
  const [radius, setRadius]         = useState(5000)
  const [maxResults, setMaxResults] = useState(20)
  const [view, setView]             = useState<'search' | 'table'>(initialView)
  const [savedResults, setSavedResults] = useState<SavedResult[]>([])
  const [loadingTable, setLoadingTable] = useState(false)
  const [savingToTable, setSavingToTable] = useState(false)
  const [tableFilter, setTableFilter]     = useState('')
  const [confirmConvert, setConfirmConvert] = useState<SavedResult | null>(null)
  const [convertingOne, setConvertingOne]   = useState(false)

  const { data: session } = useSession()
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

  const loadTable = useCallback(async () => {
    setLoadingTable(true)
    try {
      const r = await fetch('/api/prospecting/table')
      if (r.ok) setSavedResults(await r.json())
    } catch {}
    finally { setLoadingTable(false) }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (view === 'table') loadTable() }, [view])

  const saveToTable = async () => {
    const toSave = places.filter(p => selected.has(p.placeId))
    if (!toSave.length) return
    setSavingToTable(true)
    try {
      const r = await fetch('/api/prospecting/table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places: toSave, city, category }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      showToast('success', `${data.saved} registro(s) guardados en Prospector Table`)
      setSelected(new Set())
      setView('table')
      loadTable()
    } catch (e: any) {
      showToast('error', e.message || 'Error al guardar')
    } finally {
      setSavingToTable(false)
    }
  }

  const deleteFromTable = async (id: string) => {
    await fetch('/api/prospecting/table', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSavedResults(prev => prev.filter(r => r.id !== id))
  }

  const convertOneToLead = async (record: SavedResult) => {
    setConvertingOne(true)
    try {
      const place = {
        placeId:      record.placeId,
        name:         record.name,
        address:      record.address ?? '',
        phone:        record.phone   ?? '',
        website:      record.website ?? '',
        rating:       record.rating,
        totalRatings: record.totalRatings,
        types:        record.types ? JSON.parse(record.types) : [],
      }

      const res = await fetch('/api/prospecting/convert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ places: [place] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Marcar como convertido en la tabla
      await fetch('/api/prospecting/table', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: record.id, convertedToLead: true }),
      })
      setSavedResults(prev => prev.map(r => r.id === record.id ? { ...r, convertedToLead: true } : r))

      const msg = data.created > 0
        ? `✓ ${record.name} pasó a Lista como "Identificación" — responsable: ${(session?.user as any)?.name ?? 'tú'}`
        : `${record.name} ya existía en la Lista`
      showToast(data.created > 0 ? 'success' : 'info' as any, msg)
      onLeadsCreated?.()
    } catch (e: any) {
      showToast('error', e.message || 'Error al convertir')
    } finally {
      setConvertingOne(false)
      setConfirmConvert(null)
    }
  }

  const markConverted = async (id: string, value: boolean) => {
    await fetch('/api/prospecting/table', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, convertedToLead: value }),
    })
    setSavedResults(prev => prev.map(r => r.id === id ? { ...r, convertedToLead: value } : r))
  }

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

  const filteredSaved = savedResults.filter(r =>
    !tableFilter ||
    r.name.toLowerCase().includes(tableFilter.toLowerCase()) ||
    r.city.toLowerCase().includes(tableFilter.toLowerCase()) ||
    r.category.toLowerCase().includes(tableFilter.toLowerCase())
  )

  return (
    <div className="space-y-5">

      {/* View tabs */}
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('search')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            view === 'search' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Search size={13} /> Buscar
        </button>
        <button
          onClick={() => setView('table')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            view === 'table' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Table2 size={13} /> Prospector Table
          {savedResults.length > 0 && (
            <span className="bg-orange-500/30 text-orange-300 text-[10px] px-1.5 py-0.5 rounded-full">
              {savedResults.length}
            </span>
          )}
        </button>
      </div>
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

      {view === 'search' && (<>

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
            {[10, 20, 50].map(n => (
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveToTable}
                    disabled={savingToTable}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-600"
                  >
                    {savingToTable ? <Loader2 size={14} className="animate-spin" /> : <Table2 size={14} />}
                    Prospector Table
                  </button>
                  <button
                    onClick={convertToLeads}
                    disabled={converting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {converting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    Agregar {selected.size} a Lista
                  </button>
                </div>
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

      </>)}

      {/* Confirm convert popup */}
      {confirmConvert && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                <UserPlus size={18} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Pasar a Identificación</h3>
                <p className="text-gray-400 text-sm mt-0.5">Esto creará un lead en la Lista</p>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-5 space-y-2">
              <p className="text-white font-medium">{confirmConvert.name}</p>
              {confirmConvert.address && <p className="text-xs text-gray-500">{confirmConvert.address}</p>}
              <div className="flex flex-wrap gap-3 pt-1">
                {confirmConvert.phone && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Phone size={10} /> {confirmConvert.phone}
                  </span>
                )}
                {confirmConvert.website && (
                  <span className="text-xs text-orange-400 flex items-center gap-1">
                    <Globe size={10} /> {confirmConvert.website.replace(/^https?:\/\//, '').slice(0, 30)}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2.5 mb-5 text-xs text-blue-300 flex items-center gap-2">
              <CheckCircle2 size={13} />
              Responsable: <span className="font-medium">{(session?.user as any)?.name ?? session?.user?.email ?? 'tú'}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmConvert(null)}
                disabled={convertingOne}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => convertOneToLead(confirmConvert)}
                disabled={convertingOne}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                {convertingOne ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prospector Table ── */}
      {view === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre, ciudad, categoría..."
                  value={tableFilter}
                  onChange={e => setTableFilter(e.target.value)}
                  className="pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 w-72"
                />
              </div>
              <span className="text-xs text-gray-500">{filteredSaved.length} registros</span>
            </div>
            <button
              onClick={loadTable}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={13} className={loadingTable ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {loadingTable ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <Loader2 size={16} className="animate-spin" /> Cargando tabla...
            </div>
          ) : filteredSaved.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Table2 size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">{savedResults.length === 0 ? 'Tabla vacía' : 'Sin resultados para ese filtro'}</p>
              <p className="text-xs mt-1">Busca negocios y usa "Prospector Table" para guardarlos aquí</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr className="text-xs text-gray-400 uppercase">
                      <th className="text-left px-4 py-3">Negocio</th>
                      <th className="text-left px-4 py-3">Contacto</th>
                      <th className="text-left px-4 py-3">Ciudad</th>
                      <th className="text-left px-4 py-3">Categoría</th>
                      <th className="text-center px-4 py-3">Rating</th>
                      <th className="text-center px-4 py-3">Estado</th>
                      <th className="text-center px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredSaved.map(r => (
                      <tr key={r.id} className={`hover:bg-gray-800/50 transition-colors ${r.convertedToLead ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{r.name}</p>
                          {r.address && <p className="text-xs text-gray-500 truncate max-w-[200px]">{r.address}</p>}
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          {r.phone && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone size={10} className="text-gray-600" /> {r.phone}
                            </p>
                          )}
                          {r.website && (
                            <a href={r.website} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-orange-400 hover:underline flex items-center gap-1">
                              <ExternalLink size={10} />
                              {r.website.replace(/^https?:\/\//, '').slice(0, 25)}
                            </a>
                          )}
                          {!r.phone && !r.website && <span className="text-xs text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{r.city}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                            {r.category.length > 25 ? r.category.slice(0, 25) + '…' : r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.rating
                            ? <span className="text-xs text-yellow-400 flex items-center justify-center gap-1">
                                <Star size={10} className="fill-yellow-400" /> {r.rating}
                              </span>
                            : <span className="text-xs text-gray-600">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => markConverted(r.id, !r.convertedToLead)}
                            className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                              r.convertedToLead
                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-orange-500/30 hover:text-orange-400'
                            }`}
                          >
                            {r.convertedToLead ? '✓ Convertido' : 'Pendiente'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!r.convertedToLead && (
                              <button
                                onClick={() => setConfirmConvert(r)}
                                className="text-gray-600 hover:text-orange-400 transition-colors"
                                title="Pasar a Identificación"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteFromTable(r.id)}
                              className="text-gray-600 hover:text-red-400 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
