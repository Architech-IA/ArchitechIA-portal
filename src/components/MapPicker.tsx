'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  onSelect: (lat: number, lng: number, locationName: string) => void
  radius: number
}

function ClickHandler({ onSelect, radius }: Props) {
  const [pos, setPos] = useState<[number, number] | null>(null)

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng
      setPos([lat, lng])

      // Reverse geocode con Nominatim
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
          { headers: { 'User-Agent': 'ArchiTechIA-Portal/1.0' } }
        )
        const data = await res.json()
        const addr = data.address
        const name =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.county ||
          addr.state ||
          data.display_name.split(',')[0]
        onSelect(lat, lng, name.trim())
      } catch {
        onSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      }
    },
  })

  return pos ? (
    <>
      <Marker position={pos} />
      <Circle
        center={pos}
        radius={radius}
        pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.1 }}
      />
    </>
  ) : null
}

export default function MapPicker({ onSelect, radius }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <MapContainer
      center={[4.5709, -74.2973]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onSelect={onSelect} radius={radius} />
    </MapContainer>
  )
}
