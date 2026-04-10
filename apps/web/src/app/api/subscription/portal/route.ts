import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@opentomy/db'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } })
  if (!sub?.stripeCustomerId || sub.stripeCustomerId.startsWith('pending_')) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const returnUrl = `${process.env.NEXTAUTH_URL}/subscription`
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl,
  })

  // If called from a form POST, redirect directly
  const accept = req.headers.get('accept') ?? ''
  if (!accept.includes('application/json')) {
    return Response.redirect(portalSession.url, 303)
  }

  return NextResponse.json({ portal_url: portalSession.url })
}
