// ============================================
// LEMONSQUEEZY BILLING UTILITIES
// ============================================

export interface LemonSqueezyConfig {
  apiKey: string
  storeId: string
  webhookSecret: string
}

let config: LemonSqueezyConfig | null = null

export function getLemonSqueezyConfig(): LemonSqueezyConfig {
  if (!config) {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY
    const storeId = process.env.LEMONSQUEEZY_STORE_ID
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

    if (!apiKey) {
      throw new Error('LEMONSQUEEZY_API_KEY is not configured')
    }
    if (!storeId) {
      throw new Error('LEMONSQUEEZY_STORE_ID is not configured')
    }
    if (!webhookSecret) {
      throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET is not configured')
    }

    config = { apiKey, storeId, webhookSecret }
  }
  return config
}

// Plan variant IDs from LemonSqueezy
export function getVariantIds() {
  return {
    basic: process.env.LEMONSQUEEZY_VARIANT_BASIC || '',
    pro: process.env.LEMONSQUEEZY_VARIANT_PRO || '',
    agency: process.env.LEMONSQUEEZY_VARIANT_AGENCY || '',
  }
}

export const PLANS = {
  basic: {
    name: 'Basic',
    description: 'For small businesses',
    price: 29,
    features: ['Up to 3 clients', 'Basic booking', 'Email notifications'],
    variantId: process.env.LEMONSQUEEZY_VARIANT_BASIC || '',
  },
  pro: {
    name: 'Pro',
    description: 'For growing agencies',
    price: 79,
    features: ['Up to 10 clients', 'Calendar sync', 'Custom branding', 'Priority support'],
    variantId: process.env.LEMONSQUEEZY_VARIANT_PRO || '',
  },
  agency: {
    name: 'Agency',
    description: 'For large agencies',
    price: 199,
    features: ['Unlimited clients', 'Full white-label', 'API access', 'Dedicated support'],
    variantId: process.env.LEMONSQUEEZY_VARIANT_AGENCY || '',
  },
}

export type PlanKey = keyof typeof PLANS

// LemonSqueezy API base URL
const LEMONSQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1'

// Helper to make authenticated requests to LemonSqueezy API
export async function lemonSqueezyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiKey } = getLemonSqueezyConfig()

  const response = await fetch(`${LEMONSQUEEZY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LemonSqueezy API error: ${response.status} - ${error}`)
  }

  return response.json()
}

// Create a checkout session
export async function createCheckout(params: {
  variantId: string
  customData: Record<string, string>
  customerEmail?: string
  successUrl: string
  cancelUrl?: string
}): Promise<{ checkoutUrl: string }> {
  const { storeId } = getLemonSqueezyConfig()

  interface CheckoutResponse {
    data: {
      attributes: {
        url: string
      }
    }
  }

  const response = await lemonSqueezyFetch<CheckoutResponse>('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            custom: params.customData,
            email: params.customerEmail,
          },
          checkout_options: {
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
          },
          product_options: {
            redirect_url: params.successUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: params.variantId,
            },
          },
        },
      },
    }),
  })

  return { checkoutUrl: response.data.attributes.url }
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  interface SubscriptionResponse {
    data: {
      id: string
      attributes: {
        status: string
        renews_at: string
        ends_at: string | null
        cancelled: boolean
        customer_id: number
        variant_id: number
      }
    }
  }

  const response = await lemonSqueezyFetch<SubscriptionResponse>(
    `/subscriptions/${subscriptionId}`
  )
  return response.data
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  return lemonSqueezyFetch(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  })
}

// Get customer portal URL
export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  interface CustomerResponse {
    data: {
      attributes: {
        urls: {
          customer_portal: string
        }
      }
    }
  }

  const response = await lemonSqueezyFetch<CustomerResponse>(`/customers/${customerId}`)
  return response.data.attributes.urls.customer_portal
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

// Map LemonSqueezy status to our subscription status
export function mapLemonSqueezyStatus(
  status: string
): 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete' {
  switch (status) {
    case 'active':
      return 'active'
    case 'cancelled':
    case 'expired':
      return 'cancelled'
    case 'past_due':
      return 'past_due'
    case 'on_trial':
      return 'trialing'
    case 'unpaid':
    case 'paused':
    default:
      return 'incomplete'
  }
}

// Get variant ID from plan name
export function getVariantIdForPlan(plan: PlanKey): string {
  const variants = getVariantIds()
  return variants[plan] || ''
}

// Get plan from variant ID
export function getPlanFromVariantId(variantId: string): PlanKey {
  const variants = getVariantIds()

  for (const [plan, id] of Object.entries(variants)) {
    if (id === variantId) {
      return plan as PlanKey
    }
  }

  return 'basic' // default
}
