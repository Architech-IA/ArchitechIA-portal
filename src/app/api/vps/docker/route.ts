import { NextResponse } from 'next/server'

const VPS_URL   = process.env.VPS_METRICS_URL   || ''
const VPS_TOKEN = process.env.VPS_METRICS_TOKEN || ''

export async function GET() {
  if (!VPS_URL) return NextResponse.json({ error: 'VPS_METRICS_URL no configurada' }, { status: 503 })
  try {
    const res = await fetch(VPS_URL + '/docker', {
      headers: { Authorization: 'Bearer ' + VPS_TOKEN },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ error: 'Agent error ' + res.status }, { status: 502 })
    return NextResponse.json(await res.json())
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
