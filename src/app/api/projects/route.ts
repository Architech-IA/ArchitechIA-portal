import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      select: { id: true, name: true, status: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(projects)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
