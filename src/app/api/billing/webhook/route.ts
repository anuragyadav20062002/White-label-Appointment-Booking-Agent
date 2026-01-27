import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(key, {
    apiVersion: '2025-12-15.clover',
  })
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createAdminClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.subscription && session.metadata?.tenant_id) {
          // Get subscription details
          const subscriptionResponse = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          // Cast to proper type to access properties
          const subscription = subscriptionResponse as unknown as {
            id: string
            status: string
            metadata?: { plan?: string }
            current_period_start: number
            current_period_end: number
            cancel_at_period_end: boolean
          }

          // Update database
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('subscriptions')
            .upsert({
              tenant_id: session.metadata.tenant_id,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
              plan: (subscription.metadata?.plan as 'basic' | 'pro' | 'agency') || 'basic',
              status: subscription.status === 'active' ? 'active' : 'trialing',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            }, {
              onConflict: 'tenant_id',
            })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subData = event.data.object as unknown as {
          id: string
          status: Stripe.Subscription.Status
          metadata?: { tenant_id?: string; plan?: string }
          current_period_start: number
          current_period_end: number
          cancel_at_period_end: boolean
        }
        const tenantId = subData.metadata?.tenant_id

        if (tenantId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('subscriptions')
            .update({
              status: mapStripeStatus(subData.status),
              plan: (subData.metadata?.plan as 'basic' | 'pro' | 'agency') || 'basic',
              current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subData.cancel_at_period_end,
            })
            .eq('stripe_subscription_id', subData.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object as unknown as { id: string }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', deletedSub.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as { subscription?: string }

        if (invoice.subscription) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as unknown as { subscription?: string }

        if (invoice.subscription) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', invoice.subscription)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status): 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete' {
  switch (status) {
    case 'active':
      return 'active'
    case 'canceled':
      return 'cancelled'
    case 'past_due':
      return 'past_due'
    case 'trialing':
      return 'trialing'
    default:
      return 'incomplete'
  }
}
