/**
 * POST /api/files/pack
 * Create and upload a .optmy quiz file from a JSON payload.
 * Requires authentication.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveIdentity } from '@/lib/apiAuth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'fill_blank']),
  stem: z.string().min(1),
  options: z.array(z.string()).default([]),
  correct_index: z.number().int().default(-1),
  correct_text: z.string().optional(),
  explanation: z.string().optional(),
  image_url: z.string().url().nullish(),
  points: z.number().positive().default(1),
  order: z.number().int().min(0),
})

const SettingsSchema = z.object({
  shuffle_questions: z.boolean().default(false),
  shuffle_options: z.boolean().default(false),
  show_explanations: z.boolean().default(true),
  time_limit_seconds: z.number().int().positive().nullable().default(null),
  max_attempts: z.number().int().positive().nullable().default(null),
  pass_score_percent: z.number().min(0).max(100).nullable().default(null),
})

const PackSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(20).default([]),
  thumbnail_url: z.string().url().nullish(),
  questions: z.array(QuestionSchema).min(1).max(500),
  settings: SettingsSchema.default({
    shuffle_questions: false,
    shuffle_options: false,
    show_explanations: true,
    time_limit_seconds: null,
    max_attempts: null,
    pass_score_percent: null,
  }),
})

export async function POST(req: NextRequest) {
  const identity = await resolveIdentity(req)
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = PackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  try {
    const result = await container.packQuizFile.execute({
      creatorId: identity.userId,
      title: parsed.data.title,
      description: parsed.data.description,
      tags: parsed.data.tags,
      thumbnailUrl: parsed.data.thumbnail_url,
      questions: parsed.data.questions,
      settings: parsed.data.settings,
    })

    return NextResponse.json(
      { file_id: result.fileId, message: 'Quiz packed and uploaded successfully' },
      { status: 201 },
    )
  } catch (error) {
    return toHttpResponse(error)
  }
}
