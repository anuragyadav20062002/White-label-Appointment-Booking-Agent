import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// Deprecated: Use getStripe() instead to avoid build-time errors
export const stripe = null as unknown as Stripe

export const PLANS = {
  basic: {
    name: 'Basic',
    description: 'For small businesses',
    features: ['Up to 3 clients', 'Basic booking', 'Email notifications'],
    priceId: process.env.STRIPE_PRICE_BASIC || '',
  },
  pro: {
    name: 'Pro',
    description: 'For growing agencies',
    features: ['Up to 10 clients', 'Calendar sync', 'Custom branding', 'Priority support'],
    priceId: process.env.STRIPE_PRICE_PRO || '',
  },
  agency: {
    name: 'Agency',
    description: 'For large agencies',
    features: ['Unlimited clients', 'Full white-label', 'API access', 'Dedicated support'],
    priceId: process.env.STRIPE_PRICE_AGENCY || '',
  },
}

export type PlanKey = keyof typeof PLANS
