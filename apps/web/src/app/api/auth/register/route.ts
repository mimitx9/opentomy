import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@opentomy/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      subscription: {
        create: {
          stripeCustomerId: `pending_${Date.now()}`,
          status: 'TRIALING',
          tier: 'FREE',
          trialEndsAt,
        },
      },
    },
  })

  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 })
}
