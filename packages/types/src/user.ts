export type UserRole = 'USER' | 'CREATOR' | 'ADMIN'

export interface UserProfile {
  id: string
  email: string
  name?: string | null
  avatarUrl?: string | null
  role: UserRole
  createdAt: string
}

export interface UserSubscription {
  id: string
  userId: string
  stripeCustomerId: string
  tier: import('./file').SubscriptionTier
  status: import('./file').SubscriptionStatus
  trialEndsAt?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd: boolean
}
