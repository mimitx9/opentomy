import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@opentomy/db'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session
      if (s.mode !== 'subscription') break
      const userId = s.metadata?.userId
      if (!userId) break
      await prisma.subscription.update({
        where: { userId },
        data: {
          stripeSubscriptionId: s.subscription as string,
          status: 'ACTIVE',
          tier: 'PRO',
        },
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const dbSub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
      })
      if (!dbSub) break
      await prisma.subscription.update({
        where: { id: dbSub.id },
        data: {
          status: sub.status.toUpperCase() as 'ACTIVE' | 'PAST_DUE' | 'CANCELED',
          stripePriceId: sub.items.data[0]?.price.id,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'CANCELED', tier: 'FREE' },
      })
      break
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice
      if (typeof inv.subscription === 'string') {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: inv.subscription },
          data: { status: 'PAST_DUE' },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
