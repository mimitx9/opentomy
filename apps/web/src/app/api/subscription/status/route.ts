import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@opentomy/db'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } })
  const now = new Date()
  const isActive = sub?.status === 'ACTIVE'
  const isTrialing = sub?.status === 'TRIALING' && sub.trialEndsAt != null && sub.trialEndsAt > now

  return NextResponse.json({
    subscription: sub,
    tier: sub?.tier ?? 'FREE',
    status: sub?.status ?? null,
    trial_ends_at: sub?.trialEndsAt ?? null,
    can_decrypt: isActive || isTrialing,
  })
}
