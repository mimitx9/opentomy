import type { ISubscriptionRepository } from '../../ports/outbound/repositories/ISubscriptionRepository'
import type { SubscriptionService } from '../../domain/services/SubscriptionService'
import type { Subscription } from '../../domain/entities/Subscription'

export interface GetSubscriptionStatusOutput {
  subscription: Subscription | null
  tier: string
  status: string | null
  trialEndsAt: string | null
  canDecrypt: boolean
}

export class GetSubscriptionStatusUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async execute(userId: string): Promise<GetSubscriptionStatusOutput> {
    const subscription = await this.subscriptionRepo.findByUserId(userId)
    const canDecrypt = this.subscriptionService.canDecrypt(subscription)

    return {
      subscription,
      tier: subscription?.tier ?? 'FREE',
      status: subscription?.status ?? null,
      trialEndsAt: subscription?.trialEndsAt?.toISOString() ?? null,
      canDecrypt,
    }
  }
}
