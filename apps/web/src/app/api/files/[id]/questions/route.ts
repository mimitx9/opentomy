import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, Prisma } from '@opentomy/db'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'
import type { QuizQuestion } from '@/types/quizSession'

interface QuestionsBody {
  subjectIds?: number[]
  systems?: string[]
  limit?: number
  shuffle?: boolean
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null

  try {
    const { access } = await container.getFileWithAccess.execute(params.id, userId)
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'access_denied' }, { status: 403 })
    }

    const body: QuestionsBody = await req.json()
    const { subjectIds = [], systems = [], limit = 40, shuffle = true } = body

    // Build WHERE clauses dynamically
    const subjectFilter = subjectIds.length > 0
      ? Prisma.sql`AND s.id IN (${Prisma.join(subjectIds)})`
      : Prisma.empty

    const systemFilter = systems.length > 0
      ? Prisma.sql`AND q.id IN (
          SELECT qp2.questionId FROM QuestionProfile qp2
          WHERE qp2.attributeType = 'SYSTEM' AND qp2.value IN (${Prisma.join(systems)})
        )`
      : Prisma.empty

    const orderBy = shuffle ? Prisma.sql`ORDER BY RAND()` : Prisma.sql`ORDER BY q.sortOrder`

    const questionRows = await prisma.$queryRaw<{ id: number; stem: string; imageUrl: string | null; difficulty: number }[]>(
      Prisma.sql`
        SELECT DISTINCT q.id, q.stem, q.imageUrl, q.difficulty
        FROM Question q
        JOIN QuizSet qs ON q.quizSetId = qs.id
        JOIN Exam e ON qs.examId = e.id
        JOIN Subject s ON e.subjectId = s.id
        WHERE s.fileId = ${params.id}
        ${subjectFilter}
        ${systemFilter}
        ${orderBy}
        LIMIT ${limit}
      `
    )

    if (!questionRows.length) {
      return NextResponse.json([])
    }

    const questionIds = questionRows.map(q => q.id)

    const [answers, profiles] = await Promise.all([
      prisma.$queryRaw<{ id: number; questionId: number; text: string; isCorrect: boolean; explanation: string | null; imageUrl: string | null; sortOrder: number }[]>(
        Prisma.sql`
          SELECT id, questionId, text, isCorrect, explanation, imageUrl, sortOrder
          FROM Answer WHERE questionId IN (${Prisma.join(questionIds)})
          ORDER BY sortOrder
        `
      ),
      prisma.$queryRaw<{ questionId: number; attributeType: string; value: string }[]>(
        Prisma.sql`
          SELECT questionId, attributeType, value
          FROM QuestionProfile WHERE questionId IN (${Prisma.join(questionIds)})
        `
      ),
    ])

    const questions: QuizQuestion[] = questionRows.map(q => {
      const qAnswers = answers
        .filter(a => a.questionId === q.id)
        .map(a => ({
          id: a.id,
          text: a.text,
          is_correct: Boolean(a.isCorrect),
          explanation: a.explanation ?? undefined,
          image_url: a.imageUrl ?? undefined,
        }))

      const systemProfile = profiles.find(p => p.questionId === q.id && p.attributeType === 'SYSTEM')
      const subjectProfile = profiles.find(p => p.questionId === q.id && p.attributeType === 'SUBJECT')

      return {
        id: q.id,
        stem: q.stem,
        image_url: q.imageUrl ?? undefined,
        answers: qAnswers,
        system: systemProfile?.value,
        subject: subjectProfile?.value,
      }
    })

    return NextResponse.json(questions)
  } catch (error) {
    return toHttpResponse(error)
  }
}
