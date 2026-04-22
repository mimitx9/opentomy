import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, Prisma } from '@opentomy/db'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null

  try {
    const { access } = await container.getFileWithAccess.execute(params.id, userId)
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'access_denied' }, { status: 403 })
    }

    const rows = await prisma.$queryRaw<{ id: number; code: string; name: string; sortOrder: number; questionCount: bigint }[]>(
      Prisma.sql`
        SELECT s.id, s.code, s.name, s.sortOrder, COUNT(q.id) AS questionCount
        FROM Subject s
        JOIN Exam e ON e.subjectId = s.id
        JOIN QuizSet qs ON qs.examId = e.id
        JOIN Question q ON q.quizSetId = qs.id
        WHERE s.fileId = ${params.id}
        GROUP BY s.id, s.code, s.name, s.sortOrder
        ORDER BY s.sortOrder
      `
    )

    return NextResponse.json(
      rows.map(r => ({ ...r, questionCount: Number(r.questionCount) }))
    )
  } catch (error) {
    return toHttpResponse(error)
  }
}
