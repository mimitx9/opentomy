/**
 * POST /api/decrypt
 * The most security-critical endpoint.
 * Verifies user has access, then issues a short-lived decrypt token.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@opentomy/db'
import { generateDecryptToken } from '@opentomy/crypto'
import { z } from 'zod'

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

  const { file_id } = parsed.data
  const userId = session.user.id

  // Load subscription
  const subscription = await prisma.subscription.findUnique({ where: { userId } })

  const now = new Date()
  const isActive = subscription?.status === 'ACTIVE'
  const isTrialing = subscription?.status === 'TRIALING' && subscription.trialEndsAt != null && subscription.trialEndsAt > now

  // Check direct file access
  const fileAccess = await prisma.fileAccess.findUnique({
    where: { userId_fileId: { userId, fileId: file_id } },
  })
  const hasDirectAccess = fileAccess != null && (fileAccess.expiresAt == null || fileAccess.expiresAt > now)

  const canDecrypt = isActive || isTrialing || hasDirectAccess

  if (!canDecrypt) {
    return NextResponse.json(
      {
        error: 'access_denied',
        tier: subscription?.tier ?? 'FREE',
        trial_ends_at: subscription?.trialEndsAt ?? null,
        upgrade_url: '/subscription',
      },
      { status: 403 },
    )
  }

  const serverSecret = process.env.SERVER_DECRYPT_SECRET
  if (!serverSecret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const { token, expiresAt } = await generateDecryptToken(serverSecret, file_id, userId)

  // Store single-use token
  await prisma.decryptToken.create({
    data: { userId, fileId: file_id, token, expiresAt },
  })

  return NextResponse.json({ decrypt_token: token, expires_at: expiresAt.toISOString() })
}
