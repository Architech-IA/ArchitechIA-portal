import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [allLeads, proposals, projects, activities] = await Promise.all([
      prisma.lead.findMany({ select: { status: true, estimatedValue: true } }),
      prisma.proposal.findMany({ select: { status: true } }),
      prisma.project.findMany({ select: { status: true, progress: true } }),
      prisma.activity.count(),
    ])

    const totalLeads     = allLeads.length
    const leadsGanados   = allLeads.filter(l => l.status === 'WON').length
    const winRate        = totalLeads > 0 ? Math.round((leadsGanados / totalLeads) * 100) : 0
    const pipelineValue  = allLeads
      .filter(l => !['WON', 'LOST'].includes(l.status))
      .reduce((a, l) => a + l.estimatedValue, 0)

    const activeProjects    = projects.filter(p => !['COMPLETED', 'CANCELLED'].includes(p.status)).length
    const completedProjects = projects.filter(p => p.status === 'COMPLETED').length
    const avgProgress       = activeProjects > 0
      ? Math.round(projects.filter(p => !['COMPLETED', 'CANCELLED'].includes(p.status)).reduce((a, p) => a + p.progress, 0) / activeProjects)
      : 0

    const proposalsAccepted = proposals.filter(p => p.status === 'ACCEPTED').length
    const proposalsPending  = proposals.filter(p => ['DRAFT', 'SENT'].includes(p.status)).length

    return NextResponse.json({
      online:              true,
      leads:               totalLeads,
      leads_won:           leadsGanados,
      win_rate:            winRate,
      pipeline_value:      pipelineValue,
      proposals_total:     proposals.length,
      proposals_accepted:  proposalsAccepted,
      proposals_pending:   proposalsPending,
      projects_active:     activeProjects,
      projects_completed:  completedProjects,
      avg_progress:        avgProgress,
      activities:          activities,
      updated_at:          new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ online: false }, { status: 200 })
  }
}
