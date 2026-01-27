import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  getRazorpayConfig,
  verifyWebhookSignature,
  mapRazorpayStatus,
  getPlanFromPlanId,
} from '@/lib/razorpay'

// Razorpay webhook event types
interface RazorpayWebhookEvent {
  entity: string
  account_id: string
  event: string
  contains: string[]
  payload: {
    subscription?: {
      entity: {
        id: string
        plan_id: string
        customer_id: string
        status: string
        current_start: number
        current_end: number
        ended_at: number | null
        quantity: number
        notes: {
          tenant_id?: string
          user_id?: string
          plan?: string
        }
        short_url: string
      }
    }
    payment?: {
      entity: {
        id: string
        amount: number
        currency: string
        status: string
        method: string
        description: string
        email: string
        contact: string
        notes: Record<string, string>
      }
    }
  }
  created_at: number
}

export async function POST(request: NextRequest) {
  try {
    const { webhookSecret } = getRazorpayConfig()

    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
    if (!isValid) {
      console.error('Webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event: RazorpayWebhookEvent = JSON.parse(rawBody)
    const supabase = createAdminClient()

    const eventName = event.event

    switch (eventName) {
      case 'subscription.authenticated': {
        // Customer authenticated payment method, subscription pending first charge
        const subscription = event.payload.subscription?.entity
        if (!subscription) break

        const tenantId = subscription.notes?.tenant_id
        if (!tenantId) {
          console.error('No tenant_id in subscription.authenticated event')
          break
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .upsert({
            tenant_id: tenantId,
            razorpay_subscription_id: subscription.id,
            razorpay_customer_id: subscription.customer_id,
            plan: subscription.notes?.plan || getPlanFromPlanId(subscription.plan_id),
            status: 'trialing', // Authenticated but not yet charged
            current_period_start: new Date(subscription.current_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_end * 1000).toISOString(),
            cancel_at_period_end: false,
          }, {
            onConflict: 'tenant_id',
          })
        break
      }

      case 'subscription.activated': {
        // Subscription is now active (first payment successful)
        const subscription = event.payload.subscription?.entity
        if (!subscription) break

        const tenantId = subscription.notes?.tenant_id
        if (!tenantId) {
          // Try to find by subscription ID
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('tenant_id')
            .eq('razorpay_subscription_id', subscription.id)
            .single()

          if (existingSub) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('subscriptions')
              .update({
                status: 'active',
                razorpay_customer_id: subscription.customer_id,
                current_period_start: new Date(subscription.current_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_end * 1000).toISOString(),
              })
              .eq('razorpay_subscription_id', subscription.id)
          }
          break
        }

        const plan = subscription.notes?.plan || getPlanFromPlanId(subscription.plan_id)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .upsert({
            tenant_id: tenantId,
            razorpay_subscription_id: subscription.id,
            razorpay_customer_id: subscription.customer_id,
            plan: plan,
            status: 'active',
            current_period_start: new Date(subscription.current_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_end * 1000).toISOString(),
            cancel_at_period_end: false,
          }, {
            onConflict: 'tenant_id',
          })
        break
      }

      case 'subscription.charged': {
        // Recurring payment successful
        const subscription = event.payload.subscription?.entity
        if (!subscription) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date(subscription.current_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_end * 1000).toISOString(),
          })
          .eq('razorpay_subscription_id', subscription.id)
        break
      }

      case 'subscription.pending': {
        // Subscription created but awaiting payment
        const subscription = event.payload.subscription?.entity
        if (!subscription) break

        const tenantId = subscription.notes?.tenant_id
        if (!tenantId) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .upsert({
            tenant_id: tenantId,
            razorpay_subscription_id: subscription.id,
            razorpay_customer_id: subscription.customer_id || `pending_${tenantId}`,
            plan: subscription.notes?.plan || getPlanFromPlanId(subscription.plan_id),
            status: 'incomplete',
            current_period_start: new Date(subscription.current_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_end * 1000).toISOString(),
            cancel_at_period_end: false,
          }, {
            onConflict: 'tenant_id',
          })
        break
      }

      case 'subscription.halted': {
        // Payment failed, subscription halted
        const subscription = event.payload.subscription?.entity
        if (!subscription) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('razorpay_subscription_id', subscription.id)
        break
      }

      case 'subscription.cancelled': {
        // Subscription cancelled
        const subscription = event.payload.subscription?.entity
        if (!subscription) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancel_at_period_end: true,
          })
          .eq('razorpay_subscription_id', subscription.id)
        break
      }

      case 'subscription.completed': {
        // Subscription completed all billing cycles
        const subscription = event.payload.subscription?.entity
        if (!subscription) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'cancelled',
          })
          .eq('razorpay_subscription_id', subscription.id)
        break
      }

      case 'subscription.paused': {
        // Subscription paused
        const subscription = event.payload.subscription?.entity
        if (!subscription) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'incomplete',
          })
          .eq('razorpay_subscription_id', subscription.id)
        break
      }

      case 'subscription.resumed': {
        // Subscription resumed
        const subscription = event.payload.subscription?.entity
        if (!subscription) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: mapRazorpayStatus(subscription.status),
          })
          .eq('razorpay_subscription_id', subscription.id)
        break
      }

      case 'payment.captured':
      case 'payment.authorized': {
        // Payment events - mostly informational
        console.log('Payment event:', eventName, event.payload.payment?.entity?.id)
        break
      }

      case 'payment.failed': {
        // Payment failed - subscription might be halted
        console.log('Payment failed:', event.payload.payment?.entity?.id)
        break
      }

      default:
        console.log('Unhandled Razorpay event:', eventName)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
