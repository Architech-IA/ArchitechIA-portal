import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

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
  // Capitales de departamento
  'bogotá':           { lat: 4.7110,   lng: -74.0721 },
  'bogota':           { lat: 4.7110,   lng: -74.0721 },
  'medellín':         { lat: 6.2442,   lng: -75.5812 },
  'medellin':         { lat: 6.2442,   lng: -75.5812 },
  'cali':             { lat: 3.4516,   lng: -76.5320 },
  'barranquilla':     { lat: 10.9685,  lng: -74.7813 },
  'cartagena':        { lat: 10.3910,  lng: -75.4794 },
  'cúcuta':           { lat: 7.8939,   lng: -72.5078 },
  'cucuta':           { lat: 7.8939,   lng: -72.5078 },
  'bucaramanga':      { lat: 7.1198,   lng: -73.1227 },
  'pereira':          { lat: 4.8133,   lng: -75.6961 },
  'santa marta':      { lat: 11.2408,  lng: -74.2110 },
  'ibagué':           { lat: 4.4389,   lng: -75.2322 },
  'ibague':           { lat: 4.4389,   lng: -75.2322 },
  'pasto':            { lat: 1.2136,   lng: -77.2811 },
  'manizales':        { lat: 5.0703,   lng: -75.5138 },
  'neiva':            { lat: 2.9273,   lng: -75.2819 },
  'villavicencio':    { lat: 4.1420,   lng: -73.6266 },
  'armenia':          { lat: 4.5339,   lng: -75.6811 },
  'valledupar':       { lat: 10.4631,  lng: -73.2532 },
  'montería':         { lat: 8.7479,   lng: -75.8814 },
  'monteria':         { lat: 8.7479,   lng: -75.8814 },
  'sincelejo':        { lat: 9.3047,   lng: -75.3978 },
  'popayán':          { lat: 2.4448,   lng: -76.6147 },
  'popayan':          { lat: 2.4448,   lng: -76.6147 },
  'tunja':            { lat: 5.5353,   lng: -73.3678 },
  'florencia':        { lat: 1.6144,   lng: -75.6062 },
  'riohacha':         { lat: 11.5444,  lng: -72.9072 },
  'quibdó':           { lat: 5.6948,   lng: -76.6612 },
  'quibdo':           { lat: 5.6948,   lng: -76.6612 },
  'mocoa':            { lat: 1.1522,   lng: -76.6483 },
  'arauca':           { lat: 7.0900,   lng: -70.7617 },
  'yopal':            { lat: 5.3378,   lng: -72.3959 },
  'san josé del guaviare': { lat: 2.5706, lng: -72.6406 },
  'leticia':          { lat: -4.2153,  lng: -69.9406 },
  'inírida':          { lat: 3.8653,   lng: -67.9239 },
  'mitú':             { lat: 1.2536,   lng: -70.2351 },
  'puerto carreño':   { lat: 6.1892,   lng: -67.4850 },
  // Municipios grandes Antioquia
  'bello':            { lat: 6.3367,   lng: -75.5578 },
  'itagüí':           { lat: 6.1844,   lng: -75.5993 },
  'itagui':           { lat: 6.1844,   lng: -75.5993 },
  'envigado':         { lat: 6.1743,   lng: -75.5913 },
  'rionegro':         { lat: 6.1547,   lng: -75.3730 },
  'sabaneta':         { lat: 6.1508,   lng: -75.6172 },
  'copacabana':       { lat: 6.3489,   lng: -75.5072 },
  'apartadó':         { lat: 7.8789,   lng: -76.6294 },
  'turbo':            { lat: 8.1004,   lng: -76.7303 },
  'caucasia':         { lat: 7.9883,   lng: -75.1958 },
  'caldas':           { lat: 6.0956,   lng: -75.6336 },
  // Municipios Valle del Cauca
  'palmira':          { lat: 3.5394,   lng: -76.3036 },
  'buenaventura':     { lat: 3.8801,   lng: -77.0311 },
  'tuluá':            { lat: 4.0845,   lng: -76.2013 },
  'tulua':            { lat: 4.0845,   lng: -76.2013 },
  'buga':             { lat: 3.8994,   lng: -76.2980 },
  'cartago':          { lat: 4.7483,   lng: -75.9122 },
  'jamundí':          { lat: 3.2618,   lng: -76.5391 },
  // Cundinamarca
  'soacha':           { lat: 4.5792,   lng: -74.2175 },
  'zipaquirá':        { lat: 5.0228,   lng: -74.0056 },
  'facatativá':       { lat: 4.8145,   lng: -74.3569 },
  'fusagasugá':       { lat: 4.3375,   lng: -74.3644 },
  'girardot':         { lat: 4.3031,   lng: -74.8027 },
  'chía':             { lat: 4.8596,   lng: -74.0596 },
  'mosquera':         { lat: 4.7064,   lng: -74.2303 },
  'madrid':           { lat: 4.7348,   lng: -74.2670 },
  // Santander
  'floridablanca':    { lat: 7.0644,   lng: -73.0961 },
  'piedecuesta':      { lat: 6.9930,   lng: -73.0544 },
  'barrancabermeja':  { lat: 7.0650,   lng: -73.8538 },
  'san gil':          { lat: 6.5578,   lng: -73.1350 },
  // Atlántico
  'soledad':          { lat: 10.9167,  lng: -74.7667 },
  'malambo':          { lat: 10.8628,  lng: -74.7775 },
  // Bolívar
  'magangué':         { lat: 9.2406,   lng: -74.7547 },
  'magangue':         { lat: 9.2406,   lng: -74.7547 },
  // Boyacá
  'sogamoso':         { lat: 5.7193,   lng: -72.9294 },
  'duitama':          { lat: 5.8233,   lng: -73.0270 },
  // Tolima
  'espinal':          { lat: 4.1528,   lng: -74.8847 },
  'honda':            { lat: 5.2022,   lng: -74.7414 },
  // Nariño
  'tumaco':           { lat: 1.7990,   lng: -78.7619 },
  // Córdoba
  'lorica':           { lat: 9.2306,   lng: -75.8139 },
  'cereté':           { lat: 8.8903,   lng: -75.7923 },
  // Risaralda
  'dosquebradas':     { lat: 4.8392,   lng: -75.6628 },
  // Cauca
  'santander de quilichao': { lat: 3.0087, lng: -76.4836 },
  // Cesar
  'aguachica':        { lat: 8.3108,   lng: -73.6167 },
  // Huila
  'pitalito':         { lat: 1.8550,   lng: -76.0481 },
  'garzón':           { lat: 2.1992,   lng: -75.6267 },
  // Meta
  'acacías':          { lat: 3.9886,   lng: -73.7601 },
  // La Guajira
  'maicao':           { lat: 11.3722,  lng: -72.2437 },
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })

  const { city, category, radius = 5000, maxResults = 20, lat, lng } = await request.json()

  if (!category) {
    return NextResponse.json({ error: 'Categoría es requerida' }, { status: 400 })
  }
  if (!city && (lat === undefined || lng === undefined)) {
    return NextResponse.json({ error: 'Ubicación es requerida' }, { status: 400 })
  }

  // Coordenadas: prioridad lat/lng directo (desde mapa), luego lookup por nombre
  let resolvedCoords: { lat: number; lng: number } | null = null
  if (lat !== undefined && lng !== undefined) {
    resolvedCoords = { lat: Number(lat), lng: Number(lng) }
  } else if (city) {
    const normalized = city.toLowerCase().trim()
    resolvedCoords = CITY_COORDS[normalized] ?? null
  }

  const locationLabel = city || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
  const query = `${category} en ${locationLabel}, Colombia`

  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: 'es',
    maxResultCount: Math.min(maxResults, 20),
  }

  if (resolvedCoords) {
    body.locationBias = {
      circle: {
        center: { latitude: resolvedCoords.lat, longitude: resolvedCoords.lng },
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
      placeId:      p.id ?? '',
      name:         p.displayName?.text ?? '',
      address:      p.formattedAddress ?? '',
      phone:        p.internationalPhoneNumber ?? '',
      website:      p.websiteUri ?? '',
      rating:       p.rating ?? null,
      totalRatings: p.userRatingCount ?? 0,
      status:       p.businessStatus ?? 'OPERATIONAL',
      types:        p.types ?? [],
      lat:          p.location?.latitude ?? null,
      lng:          p.location?.longitude ?? null,
    }))

    // Log the API call
    const tokenData = token as any
    await prisma.prospectingLog.create({
      data: {
        userId:       tokenData.sub ?? 'unknown',
        userName:     tokenData.name ?? tokenData.email ?? 'unknown',
        city:         locationLabel,
        category,
        radius:       Number(radius),
        resultsCount: places.length,
        fromMap:      lat !== undefined && lng !== undefined,
      },
    }).catch(() => {}) // no bloquear si falla el log

    return NextResponse.json({ places, total: places.length, query })
  } catch (err) {
    return NextResponse.json({ error: 'Error al conectar con Google Places' }, { status: 500 })
  }
}
