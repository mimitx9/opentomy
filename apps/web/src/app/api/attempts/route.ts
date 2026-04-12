import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

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
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  try {
    const result = await container.submitQuizAttempt.execute({
      fileId: parsed.data.file_id,
      userId: session.user.id,
      answers: parsed.data.answers,
    })

    return NextResponse.json({
      attempt_id: result.attemptId,
      score: result.score,
      max_score: result.maxScore,
      percent: result.percent,
      passed: result.passed,
      answers: result.answers,
      started_at: result.startedAt,
      completed_at: result.completedAt,
    })
  } catch (error) {
    return toHttpResponse(error)
  }
}
