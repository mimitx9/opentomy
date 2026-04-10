import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@opentomy/db'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const schema = z.object({
  price_id: z.string(),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  let subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } })

  let customerId = subscription?.stripeCustomerId
  if (!customerId || customerId.startsWith('pending_')) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.name ?? undefined,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: { stripeCustomerId: customerId },
      create: {
        userId: session.user.id,
        stripeCustomerId: customerId,
        status: 'TRIALING',
        tier: 'FREE',
      },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: parsed.data.price_id, quantity: 1 }],
    success_url: parsed.data.success_url,
    cancel_url: parsed.data.cancel_url,
    metadata: { userId: session.user.id },
  })

  return NextResponse.json({ checkout_url: checkoutSession.url })
}
