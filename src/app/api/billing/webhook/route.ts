import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  getLemonSqueezyConfig,
  verifyWebhookSignature,
  mapLemonSqueezyStatus,
  getPlanFromVariantId,
} from '@/lib/lemonsqueezy'

// LemonSqueezy webhook event types
interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string
    custom_data?: {
      tenant_id?: string
      user_id?: string
      plan?: string
    }
  }
  data: {
    id: string
    type: string
    attributes: {
      store_id: number
      customer_id: number
      order_id: number
      subscription_id?: number
      variant_id: number
      status: string
      renews_at?: string
      ends_at?: string | null
      created_at: string
      updated_at: string
      cancelled?: boolean
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { webhookSecret } = getLemonSqueezyConfig()

    const rawBody = await request.text()
    const signature = request.headers.get('x-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
    if (!isValid) {
      console.error('Webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event: LemonSqueezyWebhookEvent = JSON.parse(rawBody)
    const supabase = createAdminClient()

    const eventName = event.meta.event_name
    const customData = event.meta.custom_data

    switch (eventName) {
      case 'subscription_created': {
        const tenantId = customData?.tenant_id
        if (!tenantId) {
          console.error('No tenant_id in subscription_created event')
          break
        }

        const attrs = event.data.attributes
        const plan = customData?.plan || getPlanFromVariantId(String(attrs.variant_id))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .upsert({
            tenant_id: tenantId,
            lemonsqueezy_subscription_id: String(attrs.subscription_id),
            lemonsqueezy_customer_id: String(attrs.customer_id),
            plan: plan,
            status: mapLemonSqueezyStatus(attrs.status),
            current_period_start: attrs.created_at,
            current_period_end: attrs.renews_at || null,
            cancel_at_period_end: attrs.cancelled || false,
          }, {
            onConflict: 'tenant_id',
          })
        break
      }

      case 'subscription_updated': {
        const attrs = event.data.attributes
        const subscriptionId = String(attrs.subscription_id || event.data.id)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: mapLemonSqueezyStatus(attrs.status),
            current_period_end: attrs.renews_at || null,
            cancel_at_period_end: attrs.cancelled || false,
          })
          .eq('lemonsqueezy_subscription_id', subscriptionId)
        break
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        const attrs = event.data.attributes
        const subscriptionId = String(attrs.subscription_id || event.data.id)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancel_at_period_end: true,
          })
          .eq('lemonsqueezy_subscription_id', subscriptionId)
        break
      }

      case 'subscription_payment_failed': {
        const attrs = event.data.attributes
        const subscriptionId = String(attrs.subscription_id || event.data.id)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('lemonsqueezy_subscription_id', subscriptionId)
        break
      }

      case 'subscription_payment_success': {
        const attrs = event.data.attributes
        const subscriptionId = String(attrs.subscription_id || event.data.id)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: attrs.renews_at || null,
          })
          .eq('lemonsqueezy_subscription_id', subscriptionId)
        break
      }

      case 'order_created': {
        // Order created - subscription will be created separately
        console.log('Order created:', event.data.id)
        break
      }

      default:
        console.log('Unhandled LemonSqueezy event:', eventName)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
