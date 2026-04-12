import type { ISubscriptionRepository } from '../../ports/outbound/repositories/ISubscriptionRepository'
import type { IPaymentPort } from '../../ports/outbound/IPaymentPort'

export interface CreateCheckoutInput {
  userId: string
  email: string
  name?: string | null
  priceId: string
  successUrl: string
  cancelUrl: string
}

export interface CreateCheckoutOutput {
  checkoutUrl: string
}

export class CreateCheckoutUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly payment: IPaymentPort,
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    let subscription = await this.subscriptionRepo.findByUserId(input.userId)

    let customerId = subscription?.stripeCustomerId
    if (!customerId || customerId.startsWith('pending_')) {
      customerId = await this.payment.createCustomer({
        email: input.email,
        name: input.name,
        userId: input.userId,
      })

      await this.subscriptionRepo.upsertByUserId(input.userId, {
        userId: input.userId,
        stripeCustomerId: customerId,
        status: 'TRIALING',
        tier: 'FREE',
      })
    }

    const checkoutUrl = await this.payment.createCheckoutSession({
      customerId,
      priceId: input.priceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      userId: input.userId,
    })

    return { checkoutUrl }
  }
}
