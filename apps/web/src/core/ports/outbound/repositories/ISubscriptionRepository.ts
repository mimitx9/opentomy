import type { Subscription, SubscriptionStatus, SubscriptionTier } from '../../../domain/entities/Subscription'

export interface CreateSubscriptionInput {
  userId: string
  stripeCustomerId: string
  status: SubscriptionStatus
  tier: SubscriptionTier
  trialEndsAt?: Date | null
}

export interface UpdateSubscriptionInput {
  stripeCustomerId?: string
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  status?: SubscriptionStatus
  tier?: SubscriptionTier
  currentPeriodStart?: Date | null
  currentPeriodEnd?: Date | null
  cancelAtPeriodEnd?: boolean
}

export interface ISubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>
  findById(id: string): Promise<Subscription | null>
  create(input: CreateSubscriptionInput): Promise<Subscription>
  update(id: string, input: UpdateSubscriptionInput): Promise<Subscription>
  upsertByUserId(userId: string, input: CreateSubscriptionInput): Promise<Subscription>
  updateManyByStripeSubscriptionId(stripeSubscriptionId: string, input: UpdateSubscriptionInput): Promise<void>
}
