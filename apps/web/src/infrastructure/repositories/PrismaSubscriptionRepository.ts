import { prisma } from '@opentomy/db'
import type {
  ISubscriptionRepository,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../../core/ports/outbound/repositories/ISubscriptionRepository'
import type { Subscription } from '../../core/domain/entities/Subscription'

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({ where: { userId } }) as Promise<Subscription | null>
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    }) as Promise<Subscription | null>
  }

  async findById(id: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({ where: { id } }) as Promise<Subscription | null>
  }

  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    return prisma.subscription.create({ data: input }) as Promise<Subscription>
  }

  async update(id: string, input: UpdateSubscriptionInput): Promise<Subscription> {
    return prisma.subscription.update({ where: { id }, data: input }) as Promise<Subscription>
  }

  async upsertByUserId(userId: string, input: CreateSubscriptionInput): Promise<Subscription> {
    return prisma.subscription.upsert({
      where: { userId },
      update: { stripeCustomerId: input.stripeCustomerId },
      create: input,
    }) as Promise<Subscription>
  }

  async updateManyByStripeSubscriptionId(
    stripeSubscriptionId: string,
    input: UpdateSubscriptionInput,
  ): Promise<void> {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId },
      data: input,
    })
  }
}
