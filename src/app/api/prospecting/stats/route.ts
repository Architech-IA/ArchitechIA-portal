import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [
    allLogs,
    leadsFromProspecting,
  ] = await Promise.all([
    prisma.prospectingLog.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.lead.count({ where: { source: 'GOOGLE_PLACES' } }),
  ])

  const total          = allLogs.length
  const totalResults   = allLogs.reduce((a, l) => a + l.resultsCount, 0)
  const costUSD        = +(total * 0.032).toFixed(2)

  const now      = new Date()
  const thisMonth = allLogs.filter(l => {
    const d = new Date(l.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthCost = +(thisMonth.length * 0.032).toFixed(2)

  // Top categorías
  const catMap: Record<string, number> = {}
  allLogs.forEach(l => { catMap[l.category] = (catMap[l.category] ?? 0) + 1 })
  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }))

  // Top ciudades
  const cityMap: Record<string, number> = {}
  allLogs.forEach(l => { cityMap[l.city] = (cityMap[l.city] ?? 0) + 1 })
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }))

  // Por usuario
  const userMap: Record<string, number> = {}
  allLogs.forEach(l => { userMap[l.userName] = (userMap[l.userName] ?? 0) + 1 })
  const byUser = Object.entries(userMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  // Últimos 30 días por día
  const last30: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const count = allLogs.filter(l => l.createdAt.toString().startsWith(key)).length
    last30.push({ date: key, count })
  }

  return NextResponse.json({
    total,
    thisMonth:      thisMonth.length,
    totalResults,
    costUSD,
    thisMonthCost,
    creditoRestante: +(200 - costUSD).toFixed(2),
    leadsCreated:   leadsFromProspecting,
    fromMap:        allLogs.filter(l => l.fromMap).length,
    topCategories,
    topCities,
    byUser,
    last30,
    recentLogs:     allLogs.slice(0, 10).map(l => ({
      id:          l.id,
      userName:    l.userName,
      city:        l.city,
      category:    l.category,
      results:     l.resultsCount,
      fromMap:     l.fromMap,
      createdAt:   l.createdAt,
    })),
  })
}
