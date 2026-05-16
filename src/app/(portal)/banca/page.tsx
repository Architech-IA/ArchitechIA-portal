'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, RefreshCw, Loader2, Trash2, X, CreditCard, Building2, TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Layers } from 'lucide-react'

interface BelvoLink {
  id: string
  belvoLinkId: string
  institution: string
  status: string
  createdAt: string
  _count: { accounts: number }
}

interface BelvoAccount {
  id: string
  belvoAccountId: string
  institution: string
  name: string
  type: string
  currency: string
  balance: number
  creditData: string | null
  syncedAt: string
  link: { institution: string }
}

interface BelvoTransaction {
  id: string
  amount: number
  currency: string
  description: string | null
  category: string | null
  type: string
  status: string
  valueDate: string
  installmentNumber: number | null
  installmentTotal: number | null
  merchant: string | null
  account: { name: string; institution: string }
}

const SANDBOX_INSTITUTIONS = [
  { id: 'bancolombia_co_retail', name: 'Bancolombia (Sandbox)' },
  { id: 'erebus_co_retail',      name: 'Erebus (Test bank)' },
  { id: 'nucolombia_co_retail',  name: 'Nubank Colombia (Sandbox)' },
]

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export default function BancaPage() {
  const { data: session } = useSession()
  const [links, setLinks]             = useState<BelvoLink[]>([])
  const [accounts, setAccounts]       = useState<BelvoAccount[]>([])
  const [transactions, setTransactions] = useState<BelvoTransaction[]>([])
  const [cuotasOnly, setCuotasOnly]   = useState(false)
  const [loading, setLoading]         = useState(true)
  const [syncing, setSyncing]         = useState<string | null>(null)
  const [showConnect, setShowConnect] = useState(false)
  const [connectForm, setConnectForm] = useState({ institution: '', username: '', password: '' })
  const [connecting, setConnecting]   = useState(false)
  const [connectError, setConnectError] = useState('')
  const [activeAccount, setActiveAccount] = useState<string | null>(null)
  const [tab, setTab]                 = useState<'cuentas' | 'movimientos' | 'cuotas'>('cuentas')

  const load = async () => {
    setLoading(true)
    const [l, a] = await Promise.all([
      fetch('/api/belvo/link').then(r => r.json()),
      fetch('/api/belvo/accounts').then(r => r.json()),
    ])
    setLinks(Array.isArray(l) ? l : [])
    setAccounts(Array.isArray(a) ? a : [])
    setLoading(false)
  }

  const loadTransactions = async (accountId?: string, cuotas = false) => {
    const params = new URLSearchParams()
    if (accountId) params.append('accountId', accountId)
    if (cuotas) params.append('cuotas', 'true')
    const res = await fetch(`/api/belvo/transactions?${params}`)
    setTransactions(await res.json())
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (tab === 'movimientos') loadTransactions(activeAccount ?? undefined)
    if (tab === 'cuotas') loadTransactions(activeAccount ?? undefined, true)
  }, [tab, activeAccount])

  const connect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setConnectError('')
    try {
      const res = await fetch('/api/belvo/link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowConnect(false)
      setConnectForm({ institution: '', username: '', password: '' })
      await load()
    } catch (e: any) {
      setConnectError(e.message)
    } finally {
      setConnecting(false)
    }
  }

  const syncAccounts = async (link: BelvoLink) => {
    setSyncing(link.id)
    try {
      await fetch('/api/belvo/accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: link.id }),
      })
      await load()
    } finally { setSyncing(null) }
  }

  const syncTransactions = async (account: BelvoAccount) => {
    setSyncing(account.id)
    try {
      await fetch('/api/belvo/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id, days: 90 }),
      })
      await loadTransactions(account.id, tab === 'cuotas')
    } finally { setSyncing(null) }
  }

  const deleteLink = async (link: BelvoLink) => {
    if (!confirm(`¿Eliminar conexión con ${link.institution}?`)) return
    await fetch('/api/belvo/link', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: link.id }),
    })
    await load()
  }

  const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0)
  const cuotasActivas = transactions.filter(t => t.installmentTotal && t.installmentTotal > 1)

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-orange-500" size={28} /></div>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 size={22} className="text-orange-400" /> Banca
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Conexión bancaria vía Belvo · Sandbox</p>
        </div>
        <button onClick={() => setShowConnect(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> Conectar banco
        </button>
      </div>

      {/* KPIs */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Balance total</p>
            <p className="text-2xl font-bold text-white">{formatCOP(totalBalance)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Cuentas conectadas</p>
            <p className="text-2xl font-bold text-green-400">{accounts.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Bancos vinculados</p>
            <p className="text-2xl font-bold text-orange-400">{links.length}</p>
          </div>
        </div>
      )}

      {/* Links conectados */}
      {links.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
          <Building2 size={40} className="mx-auto mb-4 text-gray-700" />
          <p className="text-gray-400 font-medium mb-1">No hay bancos conectados</p>
          <p className="text-gray-600 text-sm mb-4">Conecta tu banco para ver saldos y movimientos automáticamente</p>
          <button onClick={() => setShowConnect(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm transition-colors">
            + Conectar primer banco
          </button>
        </div>
      ) : (
        <>
          {/* Bancos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {links.map(link => (
              <div key={link.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Building2 size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{link.institution}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`flex items-center gap-1 text-[10px] ${link.status === 'valid' ? 'text-green-400' : 'text-red-400'}`}>
                        {link.status === 'valid' ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                        {link.status}
                      </span>
                      <span className="text-[10px] text-gray-600">· {link._count.accounts} cuentas</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => syncAccounts(link)} disabled={syncing === link.id} className="p-2 text-gray-500 hover:text-white transition-colors" title="Sync cuentas">
                    <RefreshCw size={14} className={syncing === link.id ? 'animate-spin' : ''} />
                  </button>
                  <button onClick={() => deleteLink(link)} className="p-2 text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
            {(['cuentas', 'movimientos', 'cuotas'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t === 'cuotas' ? '📋 Cuotas' : t === 'movimientos' ? '💸 Movimientos' : '🏦 Cuentas'}
              </button>
            ))}
          </div>

          {/* Cuentas */}
          {tab === 'cuentas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map(acc => {
                const credit = acc.creditData ? JSON.parse(acc.creditData) : null
                return (
                  <div key={acc.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-orange-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">{acc.name}</p>
                          <p className="text-[10px] text-gray-500">{acc.institution} · {acc.type}</p>
                        </div>
                      </div>
                      <button onClick={() => syncTransactions(acc)} disabled={syncing === acc.id} className="text-gray-500 hover:text-white transition-colors p-1" title="Sync transacciones">
                        <RefreshCw size={13} className={syncing === acc.id ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-gray-800">
                      <p className="text-[10px] text-gray-500 mb-0.5">Saldo disponible</p>
                      <p className="text-2xl font-bold text-white">{formatCOP(acc.balance)}</p>
                    </div>

                    {credit && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {credit.credit_limit && <div className="bg-gray-800 rounded-lg p-2"><p className="text-gray-500 text-[10px]">Cupo total</p><p className="text-white font-medium">{formatCOP(credit.credit_limit)}</p></div>}
                        {credit.available_credit_limit && <div className="bg-gray-800 rounded-lg p-2"><p className="text-gray-500 text-[10px]">Disponible</p><p className="text-green-400 font-medium">{formatCOP(credit.available_credit_limit)}</p></div>}
                        {credit.minimum_payment && <div className="bg-gray-800 rounded-lg p-2"><p className="text-gray-500 text-[10px]">Pago mínimo</p><p className="text-orange-400 font-medium">{formatCOP(credit.minimum_payment)}</p></div>}
                        {credit.next_payment_date && <div className="bg-gray-800 rounded-lg p-2"><p className="text-gray-500 text-[10px]">Próximo pago</p><p className="text-yellow-400 font-medium">{credit.next_payment_date}</p></div>}
                      </div>
                    )}

                    <p className="text-[10px] text-gray-700">Actualizado: {new Date(acc.syncedAt).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Movimientos */}
          {tab === 'movimientos' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select value={activeAccount ?? ''} onChange={e => setActiveAccount(e.target.value || null)}
                  className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500">
                  <option value="">Todas las cuentas</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr className="text-xs text-gray-400 uppercase">
                      <th className="text-left px-4 py-3">Fecha</th>
                      <th className="text-left px-4 py-3">Descripción</th>
                      <th className="text-left px-4 py-3">Categoría</th>
                      <th className="text-left px-4 py-3">Cuotas</th>
                      <th className="text-right px-4 py-3">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-600 text-sm">Sin movimientos · Haz sync de una cuenta primero</td></tr>
                    ) : transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-800/40">
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{tx.valueDate}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white truncate max-w-xs">{tx.description ?? '—'}</p>
                          {tx.merchant && <p className="text-[10px] text-gray-500">{tx.merchant}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{tx.category ?? '—'}</td>
                        <td className="px-4 py-3">
                          {tx.installmentTotal && tx.installmentTotal > 1 ? (
                            <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">
                              {tx.installmentNumber}/{tx.installmentTotal}
                            </span>
                          ) : <span className="text-gray-700">—</span>}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-mono font-medium ${tx.type === 'INFLOW' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'INFLOW' ? '+' : '-'}{formatCOP(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cuotas */}
          {tab === 'cuotas' && (
            <div className="space-y-3">
              {cuotasActivas.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-600">
                  <Layers size={32} className="mx-auto mb-3 opacity-20" />
                  <p>Sin compras a cuotas detectadas</p>
                  <p className="text-xs mt-1">Haz sync de tus cuentas de tarjeta primero</p>
                </div>
              ) : (
                <>
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex items-center justify-between">
                    <p className="text-sm text-orange-300">Total cuotas activas detectadas: <span className="font-bold">{cuotasActivas.length}</span></p>
                    <p className="text-sm text-orange-400 font-mono font-bold">
                      {formatCOP(cuotasActivas.reduce((a, t) => a + t.amount, 0))} / mes
                    </p>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-800">
                        <tr className="text-xs text-gray-400 uppercase">
                          <th className="text-left px-4 py-3">Compra</th>
                          <th className="text-left px-4 py-3">Cuenta</th>
                          <th className="text-center px-4 py-3">Cuota</th>
                          <th className="text-center px-4 py-3">Restantes</th>
                          <th className="text-right px-4 py-3">Valor cuota</th>
                          <th className="text-right px-4 py-3">Total restante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {cuotasActivas.map(tx => {
                          const restantes = (tx.installmentTotal ?? 0) - (tx.installmentNumber ?? 0)
                          const totalRestante = tx.amount * restantes
                          const pct = tx.installmentTotal ? Math.round(((tx.installmentNumber ?? 0) / tx.installmentTotal) * 100) : 0
                          return (
                            <tr key={tx.id} className="hover:bg-gray-800/40">
                              <td className="px-4 py-3">
                                <p className="text-sm text-white truncate max-w-[200px]">{tx.description ?? tx.merchant ?? '—'}</p>
                                <p className="text-[10px] text-gray-600">{tx.valueDate}</p>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400">{tx.account.name}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-sm font-bold text-orange-400">{tx.installmentNumber}/{tx.installmentTotal}</span>
                                  <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-400">{restantes}</td>
                              <td className="px-4 py-3 text-right text-sm font-mono text-white">{formatCOP(tx.amount)}</td>
                              <td className="px-4 py-3 text-right text-sm font-mono text-red-400">{formatCOP(totalRestante)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal conectar banco */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Conectar banco</h2>
              <button onClick={() => { setShowConnect(false); setConnectError('') }} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={connect} className="px-6 py-5 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2.5 text-xs text-blue-300">
                Modo Sandbox — usa credenciales de prueba
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Institución</label>
                <select required value={connectForm.institution} onChange={e => setConnectForm({...connectForm, institution: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500">
                  <option value="">Seleccionar...</option>
                  {SANDBOX_INSTITUTIONS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Usuario del banco</label>
                <input required value={connectForm.username} onChange={e => setConnectForm({...connectForm, username: e.target.value})}
                  placeholder="bnk:sandbox" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Contraseña del banco</label>
                <input required type="password" value={connectForm.password} onChange={e => setConnectForm({...connectForm, password: e.target.value})}
                  placeholder="full" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500" />
              </div>
              <div className="text-[10px] text-gray-600">
                Sandbox: usuario <code className="text-gray-400">bnk:sandbox</code> · contraseña <code className="text-gray-400">full</code>
              </div>
              {connectError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{connectError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowConnect(false); setConnectError('') }} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-sm">Cancelar</button>
                <button type="submit" disabled={connecting} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                  {connecting && <Loader2 size={13} className="animate-spin" />}
                  Conectar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
