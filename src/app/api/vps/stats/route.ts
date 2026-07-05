import { NextResponse } from 'next/server'

const VPS_URL   = process.env.VPS_METRICS_URL   || ''
const VPS_TOKEN = process.env.VPS_METRICS_TOKEN || ''

export async function GET() {
  if (!VPS_URL) {
    return NextResponse.json({ error: 'VPS_METRICS_URL no configurada' }, { status: 503 })
  }
  try {
    const res = await fetch(`${VPS_URL}/metrics`, {
      headers: VPS_TOKEN ? { Authorization: `Bearer ${VPS_TOKEN}` } : {},
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: `VPS respondió ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error de conexión'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
