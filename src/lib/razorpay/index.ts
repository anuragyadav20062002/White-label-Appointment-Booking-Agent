// ============================================
// RAZORPAY BILLING UTILITIES
// ============================================

export interface RazorpayConfig {
  keyId: string
  keySecret: string
  webhookSecret: string
}

let config: RazorpayConfig | null = null

export function getRazorpayConfig(): RazorpayConfig {
  if (!config) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!keyId) {
      throw new Error('RAZORPAY_KEY_ID is not configured')
    }
    if (!keySecret) {
      throw new Error('RAZORPAY_KEY_SECRET is not configured')
    }
    if (!webhookSecret) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured')
    }

    config = { keyId, keySecret, webhookSecret }
  }
  return config
}

// Plan IDs from Razorpay Dashboard
export function getPlanIds() {
  return {
    basic: process.env.RAZORPAY_PLAN_BASIC || '',
    pro: process.env.RAZORPAY_PLAN_PRO || '',
    agency: process.env.RAZORPAY_PLAN_AGENCY || '',
  }
}

// Plans with pricing (in INR for India)
// Note: You can adjust pricing to USD if needed
export const PLANS = {
  basic: {
    name: 'Basic',
    description: 'For small businesses',
    price: 2400, // INR per month (approx $29)
    priceDisplay: '₹2,400',
    features: ['Up to 3 clients', 'Basic booking', 'Email notifications'],
    planId: process.env.RAZORPAY_PLAN_BASIC || '',
  },
  pro: {
    name: 'Pro',
    description: 'For growing agencies',
    price: 6500, // INR per month (approx $79)
    priceDisplay: '₹6,500',
    features: ['Up to 10 clients', 'Calendar sync', 'Custom branding', 'Priority support'],
    planId: process.env.RAZORPAY_PLAN_PRO || '',
  },
  agency: {
    name: 'Agency',
    description: 'For large agencies',
    price: 16500, // INR per month (approx $199)
    priceDisplay: '₹16,500',
    features: ['Unlimited clients', 'Full white-label', 'API access', 'Dedicated support'],
    planId: process.env.RAZORPAY_PLAN_AGENCY || '',
  },
}

export type PlanKey = keyof typeof PLANS

// Razorpay API base URL
const RAZORPAY_API_URL = 'https://api.razorpay.com/v1'

// Helper to make authenticated requests to Razorpay API
export async function razorpayFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { keyId, keySecret } = getRazorpayConfig()
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const response = await fetch(`${RAZORPAY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Razorpay API error: ${response.status} - ${error}`)
  }

  return response.json()
}

// Create a subscription (returns short_url for payment)
export async function createSubscription(params: {
  planId: string
  customerId?: string
  customerEmail: string
  customerPhone?: string
  notes: Record<string, string>
  notifyUrl?: string
}): Promise<{ subscriptionId: string; shortUrl: string }> {
  interface SubscriptionResponse {
    id: string
    short_url: string
    customer_id: string
    status: string
  }

  // If no customer exists, Razorpay will create one
  const response = await razorpayFetch<SubscriptionResponse>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: params.planId,
      total_count: 120, // Max billing cycles (10 years monthly)
      quantity: 1,
      customer_notify: 1,
      notes: params.notes,
      notify_info: {
        notify_email: params.customerEmail,
        notify_phone: params.customerPhone || '',
      },
    }),
  })

  return {
    subscriptionId: response.id,
    shortUrl: response.short_url,
  }
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  interface SubscriptionResponse {
    id: string
    plan_id: string
    customer_id: string
    status: string
    current_start: number
    current_end: number
    ended_at: number | null
    quantity: number
    notes: Record<string, string>
    charge_at: number
    short_url: string
    has_scheduled_changes: boolean
    change_scheduled_at: number | null
    payment_method: string
  }

  const response = await razorpayFetch<SubscriptionResponse>(
    `/subscriptions/${subscriptionId}`
  )
  return response
}

// Cancel subscription
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean = true
): Promise<void> {
  await razorpayFetch(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
    }),
  })
}

// Pause subscription
export async function pauseSubscription(subscriptionId: string): Promise<void> {
  await razorpayFetch(`/subscriptions/${subscriptionId}/pause`, {
    method: 'POST',
    body: JSON.stringify({
      pause_at: 'now',
    }),
  })
}

// Resume subscription
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  await razorpayFetch(`/subscriptions/${subscriptionId}/resume`, {
    method: 'POST',
  })
}

// Get customer details
export async function getCustomer(customerId: string) {
  interface CustomerResponse {
    id: string
    name: string
    email: string
    contact: string
    gstin: string | null
    notes: Record<string, string>
  }

  return razorpayFetch<CustomerResponse>(`/customers/${customerId}`)
}

// Create a customer
export async function createCustomer(params: {
  name: string
  email: string
  contact?: string
  notes?: Record<string, string>
}): Promise<string> {
  interface CustomerResponse {
    id: string
  }

  const response = await razorpayFetch<CustomerResponse>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      contact: params.contact || '',
      notes: params.notes || {},
    }),
  })

  return response.id
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

// Map Razorpay subscription status to our status
export function mapRazorpayStatus(
  status: string
): 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete' {
  switch (status) {
    case 'active':
      return 'active'
    case 'authenticated': // Payment method added, pending first charge
      return 'trialing'
    case 'pending':
      return 'incomplete'
    case 'halted': // Payment failed
      return 'past_due'
    case 'cancelled':
    case 'completed':
    case 'expired':
      return 'cancelled'
    case 'paused':
      return 'incomplete'
    default:
      return 'incomplete'
  }
}

// Get plan ID from plan name
export function getPlanIdForPlan(plan: PlanKey): string {
  const plans = getPlanIds()
  return plans[plan] || ''
}

// Get plan name from plan ID
export function getPlanFromPlanId(planId: string): PlanKey {
  const plans = getPlanIds()

  for (const [plan, id] of Object.entries(plans)) {
    if (id === planId) {
      return plan as PlanKey
    }
  }

  return 'basic' // default
}

// Get subscription payment link (for managing subscription)
// Razorpay doesn't have a full customer portal, so we return the subscription short_url
export async function getSubscriptionManageUrl(subscriptionId: string): Promise<string> {
  const subscription = await getSubscription(subscriptionId)
  return subscription.short_url
}

// Fetch all invoices for a subscription
export async function getSubscriptionInvoices(subscriptionId: string) {
  interface InvoicesResponse {
    count: number
    items: Array<{
      id: string
      subscription_id: string
      amount: number
      status: string
      paid_at: number
      billing_start: number
      billing_end: number
    }>
  }

  const response = await razorpayFetch<InvoicesResponse>(
    `/invoices?subscription_id=${subscriptionId}`
  )
  return response.items
}

// Create a one-time payment link (for addons or one-time charges)
export async function createPaymentLink(params: {
  amount: number // in paise (100 paise = 1 INR)
  currency?: string
  description: string
  customerEmail: string
  customerPhone?: string
  notes?: Record<string, string>
  callbackUrl?: string
}): Promise<{ paymentLinkId: string; shortUrl: string }> {
  interface PaymentLinkResponse {
    id: string
    short_url: string
  }

  const response = await razorpayFetch<PaymentLinkResponse>('/payment_links', {
    method: 'POST',
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency || 'INR',
      description: params.description,
      customer: {
        email: params.customerEmail,
        contact: params.customerPhone || '',
      },
      notify: {
        email: true,
        sms: !!params.customerPhone,
      },
      notes: params.notes || {},
      callback_url: params.callbackUrl,
      callback_method: 'get',
    }),
  })

  return {
    paymentLinkId: response.id,
    shortUrl: response.short_url,
  }
}
