import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@opentomy/db'

// GET /api/files/mine — files uploaded by the current user
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const files = await prisma.quizFile.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: files, total: files.length })
}
