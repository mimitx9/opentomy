export interface CreateCustomerInput {
  email: string
  name?: string | null
  userId: string
}

export interface CreateCheckoutSessionInput {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  userId: string
}

export interface CreatePortalSessionInput {
  customerId: string
  returnUrl: string
}

export interface IPaymentPort {
  createCustomer(input: CreateCustomerInput): Promise<string>
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<string>
  createPortalSession(input: CreatePortalSessionInput): Promise<string>
  constructWebhookEvent(body: string, signature: string, secret: string): unknown
}
