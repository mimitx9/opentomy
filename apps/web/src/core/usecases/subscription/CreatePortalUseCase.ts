import type { ISubscriptionRepository } from '../../ports/outbound/repositories/ISubscriptionRepository'
import type { IPaymentPort } from '../../ports/outbound/IPaymentPort'
import { ValidationException } from '../../domain/exceptions/DomainException'

export interface CreatePortalOutput {
  portalUrl: string
}

export class CreatePortalUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly payment: IPaymentPort,
  ) {}

  async execute(userId: string, returnUrl: string): Promise<CreatePortalOutput> {
    const subscription = await this.subscriptionRepo.findByUserId(userId)

    if (!subscription?.stripeCustomerId || subscription.stripeCustomerId.startsWith('pending_')) {
      throw new ValidationException('No billing account found')
    }

    const portalUrl = await this.payment.createPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl,
    })

    return { portalUrl }
  }
}
