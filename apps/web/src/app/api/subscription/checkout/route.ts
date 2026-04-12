import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

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

  try {
    const result = await container.createCheckout.execute({
      userId: session.user.id,
      email: session.user.email!,
      name: session.user.name,
      priceId: parsed.data.price_id,
      successUrl: parsed.data.success_url,
      cancelUrl: parsed.data.cancel_url,
    })
    return NextResponse.json({ checkout_url: result.checkoutUrl })
  } catch (error) {
    return toHttpResponse(error)
  }
}
