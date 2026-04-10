import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@opentomy/db'
import { z } from 'zod'

const schema = z.object({
  file_id: z.string().uuid(),
  answers: z.array(z.object({
    question_id: z.string(),
    selected_index: z.number().nullable(),
    selected_text: z.string().optional(),
    time_spent_ms: z.number().optional(),
    is_correct: z.boolean(),
  })),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { file_id, answers } = parsed.data

  const correctCount = answers.filter(a => a.is_correct).length
  const maxScore = answers.length
  const score = correctCount
  const percent = maxScore > 0 ? (correctCount / maxScore) * 100 : 0

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      fileId: file_id,
      score,
      maxScore,
      percent,
      completedAt: new Date(),
      answers,
    },
  })

  return NextResponse.json({
    attempt_id: attempt.id,
    score,
    max_score: maxScore,
    percent,
    passed: percent >= 60,
    answers,
    started_at: attempt.startedAt.toISOString(),
    completed_at: attempt.completedAt!.toISOString(),
  })
}
