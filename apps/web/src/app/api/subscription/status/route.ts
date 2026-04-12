import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await container.getSubscriptionStatus.execute(session.user.id)
    return NextResponse.json({
      subscription: result.subscription,
      tier: result.tier,
      status: result.status,
      trial_ends_at: result.trialEndsAt,
      can_decrypt: result.canDecrypt,
    })
  } catch (error) {
    return toHttpResponse(error)
  }
}
