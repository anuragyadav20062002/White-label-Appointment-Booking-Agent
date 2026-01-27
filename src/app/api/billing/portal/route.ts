import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'
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

export async function POST() {
  try {
    const stripe = getStripe()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        createApiError(ErrorCodes.UNAUTHORIZED, 'Not authenticated'),
        { status: 401 }
      )
    }

    // Get user's tenant
    const { data: userDataRaw } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const userData = userDataRaw as { tenant_id: string } | null

    if (!userData) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'User not found'),
        { status: 404 }
      )
    }

    // Get subscription
    const { data: subscriptionRaw } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('tenant_id', userData.tenant_id)
      .single()

    const subscription = subscriptionRaw as { stripe_customer_id: string } | null

    if (!subscription?.stripe_customer_id || subscription.stripe_customer_id.startsWith('pending_')) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'No active subscription'),
        { status: 404 }
      )
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })

    return NextResponse.json(createApiResponse({ url: session.url }))
  } catch (error) {
    console.error('Create portal error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to create portal session'),
      { status: 500 }
    )
  }
}
