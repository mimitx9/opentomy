export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? '',
} as const
