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

    const rows = await prisma.$queryRaw<{ value: string; questionCount: bigint }[]>(
      Prisma.sql`
        SELECT qp.value, COUNT(DISTINCT qp.questionId) AS questionCount
        FROM QuestionProfile qp
        JOIN Question q ON q.id = qp.questionId
        JOIN QuizSet qs ON qs.id = q.quizSetId
        JOIN Exam e ON e.id = qs.examId
        JOIN Subject s ON s.id = e.subjectId
        WHERE s.fileId = ${params.id} AND qp.attributeType = 'SYSTEM'
        GROUP BY qp.value
        ORDER BY qp.value
      `
    )

    return NextResponse.json(
      rows.map(r => ({ name: r.value, questionCount: Number(r.questionCount) }))
    )
  } catch (error) {
    return toHttpResponse(error)
  }
}
