import Stripe from 'stripe'
import type {
  IPaymentPort,
  CreateCustomerInput,
  CreateCheckoutSessionInput,
  CreatePortalSessionInput,
} from '../../core/ports/outbound/IPaymentPort'

export class StripePaymentAdapter implements IPaymentPort {
  private readonly stripe: Stripe

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10',
      typescript: true,
    })
  }

  async createCustomer(input: CreateCustomerInput): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: input.email,
      name: input.name ?? undefined,
      metadata: { userId: input.userId },
    })
    return customer.id
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer: input.customerId,
      mode: 'subscription',
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { userId: input.userId },
    })
    return session.url!
  }

  async createPortalSession(input: CreatePortalSessionInput): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    })
    return session.url
  }

  constructWebhookEvent(body: string, signature: string, secret: string): unknown {
    return this.stripe.webhooks.constructEvent(body, signature, secret)
  }
}
