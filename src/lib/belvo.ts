const BASE_URL = process.env.BELVO_BASE_URL ?? 'https://sandbox.belvo.com'
const SECRET_ID = process.env.BELVO_SECRET_ID ?? ''
const SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD ?? ''

const authHeader = () =>
  'Basic ' + Buffer.from(`${SECRET_ID}:${SECRET_PASSWORD}`).toString('base64')

const headers = () => ({
  'Authorization': authHeader(),
  'Content-Type': 'application/json',
})

export async function belvoRequest(path: string, method = 'GET', body?: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? data.detail ?? JSON.stringify(data))
  return data
}

// ── Links ──────────────────────────────────────────────────────────────────

export async function createLink(institution: string, username: string, password: string) {
  return belvoRequest('/api/links/', 'POST', {
    institution,
    username,
    password,
    access_mode: 'single',
  })
}

export async function listLinks() {
  return belvoRequest('/api/links/')
}

export async function deleteLink(linkId: string) {
  const res = await fetch(`${BASE_URL}/api/links/${linkId}/`, {
    method: 'DELETE',
    headers: headers(),
  })
  return res.status === 204
}

// ── Accounts ───────────────────────────────────────────────────────────────

export async function fetchAccounts(linkId: string) {
  return belvoRequest('/api/accounts/', 'POST', {
    link: linkId,
    save_data: true,
  })
}

export async function listAccounts(linkId?: string) {
  const url = linkId ? `/api/accounts/?link=${linkId}` : '/api/accounts/'
  return belvoRequest(url)
}

// ── Transactions ───────────────────────────────────────────────────────────

export async function fetchTransactions(linkId: string, accountId: string, dateFrom: string, dateTo: string) {
  return belvoRequest('/api/transactions/', 'POST', {
    link: linkId,
    account: accountId,
    date_from: dateFrom,
    date_to: dateTo,
    save_data: true,
  })
}

export async function listTransactions(accountId?: string, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (accountId) params.append('account', accountId)
  if (dateFrom)  params.append('value_date__gte', dateFrom)
  if (dateTo)    params.append('value_date__lte', dateTo)
  const qs = params.toString()
  return belvoRequest(`/api/transactions/${qs ? '?' + qs : ''}`)
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function parseInstallments(description: string): { current: number; total: number } | null {
  // Patrones: "C 3/12", "Cuota 3 de 12", "3/12", "(3/12)"
  const patterns = [
    /[Cc]uota[s]?\s*(\d+)\s*[/de]+\s*(\d+)/,
    /[Cc]\s*(\d+)\s*\/\s*(\d+)/,
    /\((\d+)\/(\d+)\)/,
    /(\d+)\s*\/\s*(\d+)/,
  ]
  for (const p of patterns) {
    const m = description.match(p)
    if (m) return { current: Number(m[1]), total: Number(m[2]) }
  }
  return null
}

export function formatCOP(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
}

// Fecha ISO para N días atrás
export function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export function today() {
  return new Date().toISOString().split('T')[0]
}
