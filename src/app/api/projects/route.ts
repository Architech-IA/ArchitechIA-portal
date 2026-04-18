import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

const projectInclude = {
  users: { include: { user: { select: { id: true, name: true, email: true } } } },
  milestones: true,
} as const;

export async function GET() {
  const projects = await prisma.project.findMany({
    include: projectInclude,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, status, priority, progress, startDate, endDate, userId, proposalId } = body;

  const project = await prisma.project.create({
    data: {
      name, description, status, priority,
      progress: parseInt(progress) || 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate:   endDate   ? new Date(endDate)   : null,
      proposalId: proposalId || null,
      users: { create: { userId, role: 'OWNER' } },
    },
    include: projectInclude,
  });

  await logActivity({ type: 'CREATED', description: `creó el proyecto "${name}"`,
    entityType: 'project', entityId: project.id, userId, projectId: project.id });

  return NextResponse.json(project);
}
