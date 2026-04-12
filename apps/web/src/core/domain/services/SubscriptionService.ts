import type { Subscription } from '../entities/Subscription'

export class SubscriptionService {
  isActive(subscription: Subscription | null | undefined): boolean {
    return subscription?.status === 'ACTIVE'
  }

  isTrialActive(subscription: Subscription | null | undefined): boolean {
    if (!subscription) return false
    return (
      subscription.status === 'TRIALING' &&
      subscription.trialEndsAt != null &&
      subscription.trialEndsAt > new Date()
    )
  }

  canDecrypt(subscription: Subscription | null | undefined): boolean {
    return this.isActive(subscription) || this.isTrialActive(subscription)
  }
}
