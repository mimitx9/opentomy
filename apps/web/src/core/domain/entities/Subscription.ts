export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE'

export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID'
  | 'INCOMPLETE'

export interface Subscription {
  id: string
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId?: string | null
  stripePriceId?: string | null
  status: SubscriptionStatus
  tier: SubscriptionTier
  trialEndsAt?: Date | null
  currentPeriodStart?: Date | null
  currentPeriodEnd?: Date | null
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}
