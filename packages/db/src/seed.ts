/**
 * Development seed script.
 * Run with: npx tsx src/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  // NOTE: In production use bcrypt. This is seed-only.
  return createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('Seeding development database...')

  const user = await prisma.user.upsert({
    where: { email: 'test@opentomy.dev' },
    update: {},
    create: {
      email: 'test@opentomy.dev',
      passwordHash: hashPassword('password123'),
      name: 'Test Creator',
      role: 'CREATOR',
    },
  })

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      stripeCustomerId: 'cus_seed_test_123',
      status: 'ACTIVE',
      tier: 'PRO',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('Seed complete.')
  console.log('Test login: test@opentomy.dev / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
