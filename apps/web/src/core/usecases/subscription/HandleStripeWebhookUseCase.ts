import type Stripe from 'stripe'
import type { ISubscriptionRepository } from '../../ports/outbound/repositories/ISubscriptionRepository'
import type { IPaymentPort } from '../../ports/outbound/IPaymentPort'
import { ValidationException } from '../../domain/exceptions/DomainException'

export class HandleStripeWebhookUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly payment: IPaymentPort,
  ) {}

  async execute(rawBody: string, signature: string, webhookSecret: string): Promise<void> {
    let event: Stripe.Event
    try {
      event = this.payment.constructWebhookEvent(rawBody, signature, webhookSecret) as Stripe.Event
    } catch {
      throw new ValidationException('Invalid webhook signature')
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break
        const userId = session.metadata?.userId
        if (!userId) break

        const subscription = await this.subscriptionRepo.findByUserId(userId)
        if (!subscription) break

        await this.subscriptionRepo.update(subscription.id, {
          stripeSubscriptionId: session.subscription as string,
          status: 'ACTIVE',
          tier: 'PRO',
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const dbSub = await this.subscriptionRepo.findByStripeSubscriptionId(sub.id)
        if (!dbSub) break

        await this.subscriptionRepo.update(dbSub.id, {
          status: sub.status.toUpperCase() as 'ACTIVE' | 'PAST_DUE' | 'CANCELED',
          stripePriceId: sub.items.data[0]?.price.id,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await this.subscriptionRepo.updateManyByStripeSubscriptionId(sub.id, {
          status: 'CANCELED',
          tier: 'FREE',
        })
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        if (typeof inv.subscription === 'string') {
          await this.subscriptionRepo.updateManyByStripeSubscriptionId(inv.subscription, {
            status: 'PAST_DUE',
          })
        }
        break
      }
    }
  }
}
