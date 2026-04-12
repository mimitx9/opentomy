import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  try {
    const body = await req.text()
    await container.handleStripeWebhook.execute(body, sig, webhookSecret)
    return NextResponse.json({ received: true })
  } catch (error) {
    return toHttpResponse(error)
  }
}
