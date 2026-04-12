/**
 * POST /api/decrypt
 * The most security-critical endpoint.
 * Verifies user has access, then issues a short-lived decrypt token.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

const schema = z.object({ file_id: z.string().uuid() })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid file_id' }, { status: 400 })
  }

  try {
    const result = await container.issueDecryptToken.execute({
      fileId: parsed.data.file_id,
      userId: session.user.id,
    })
    return NextResponse.json({ decrypt_token: result.decryptToken, expires_at: result.expiresAt })
  } catch (error) {
    return toHttpResponse(error)
  }
}
