import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK = [
  'places.displayName',
  'places.formattedAddress',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.types',
  'places.location',
  'places.id',
].join(',')

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  bogota:        { lat: 4.7110,  lng: -74.0721 },
  medellin:      { lat: 6.2442,  lng: -75.5812 },
  cali:          { lat: 3.4516,  lng: -76.5320 },
  barranquilla:  { lat: 10.9685, lng: -74.7813 },
  cartagena:     { lat: 10.3910, lng: -75.4794 },
  bucaramanga:   { lat: 7.1198,  lng: -73.1227 },
  pereira:       { lat: 4.8133,  lng: -75.6961 },
  manizales:     { lat: 5.0703,  lng: -75.5138 },
  cucuta:        { lat: 7.8939,  lng: -72.5078 },
  ibague:        { lat: 4.4389,  lng: -75.2322 },
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })

  const { city, category, radius = 5000, maxResults = 20 } = await request.json()

  if (!city || !category) {
    return NextResponse.json({ error: 'Ciudad y categoría son requeridas' }, { status: 400 })
  }

  const coords = CITY_COORDS[city.toLowerCase().replace(/\s/g, '')]
  const query = `${category} en ${city}, Colombia`

  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: 'es',
    maxResultCount: Math.min(maxResults, 20),
  }

  if (coords) {
    body.locationBias = {
      circle: {
        center: { latitude: coords.lat, longitude: coords.lng },
        radius: Number(radius),
      },
    }
  }

  try {
    const res = await fetch(PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'Error de Google Places' }, { status: res.status })
    }

    const places = (data.places ?? []).map((p: any) => ({
      placeId:     p.id ?? '',
      name:        p.displayName?.text ?? '',
      address:     p.formattedAddress ?? '',
      phone:       p.internationalPhoneNumber ?? '',
      website:     p.websiteUri ?? '',
      rating:      p.rating ?? null,
      totalRatings: p.userRatingCount ?? 0,
      status:      p.businessStatus ?? 'OPERATIONAL',
      types:       p.types ?? [],
      lat:         p.location?.latitude ?? null,
      lng:         p.location?.longitude ?? null,
    }))

    return NextResponse.json({ places, total: places.length, query })
  } catch (err) {
    return NextResponse.json({ error: 'Error al conectar con Google Places' }, { status: 500 })
  }
}
