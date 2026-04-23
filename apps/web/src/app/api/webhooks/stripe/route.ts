import { NextRequest, NextResponse } from 'next/server'
import { toHttpResponse } from '@/lib/httpError'
import * as famaster from '@/lib/famaster'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  try {
    const body = await req.text()
    const result = await famaster.stripeWebhook(body, sig)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof famaster.FamasterError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return toHttpResponse(error)
  }
}
