import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ suggestions: [] })

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: q,
        includedRegionCodes: ['CO'],
        languageCode: 'es',
        includedPrimaryTypes: [
          'locality',
          'sublocality',
          'administrative_area_level_2',
          'administrative_area_level_1',
        ],
      }),
    })

    const data = await res.json()
    const suggestions = (data.suggestions ?? []).map((s: any) => ({
      placeId:      s.placePrediction?.placeId ?? '',
      mainText:     s.placePrediction?.structuredFormat?.mainText?.text ?? '',
      secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text ?? '',
    })).filter((s: any) => s.mainText)

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
