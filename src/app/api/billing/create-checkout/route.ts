import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
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

function getPriceIds() {
  return {
    basic: process.env.STRIPE_PRICE_BASIC || '',
    pro: process.env.STRIPE_PRICE_PRO || '',
    agency: process.env.STRIPE_PRICE_AGENCY || '',
  }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const PRICE_IDS = getPriceIds()

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        createApiError(ErrorCodes.UNAUTHORIZED, 'Not authenticated'),
        { status: 401 }
      )
    }

    const body = await request.json()
    const { plan } = body

    if (!plan || !PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid plan'),
        { status: 400 }
      )
    }

    // Get user's tenant
    const { data: userDataRaw } = await supabase
      .from('users')
      .select('tenant_id, email')
      .eq('id', user.id)
      .single()

    const userData = userDataRaw as { tenant_id: string; email: string } | null

    if (!userData) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'User not found'),
        { status: 404 }
      )
    }

    // Check for existing subscription
    const { data: existingSubRaw } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('tenant_id', userData.tenant_id)
      .single()

    const existingSubscription = existingSubRaw as { stripe_customer_id: string } | null
    let customerId = existingSubscription?.stripe_customer_id

    // Create customer if doesn't exist
    if (!customerId || customerId.startsWith('pending_')) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          tenant_id: userData.tenant_id,
          user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: PRICE_IDS[plan as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      subscription_data: {
        metadata: {
          tenant_id: userData.tenant_id,
          plan,
        },
      },
    })

    return NextResponse.json(createApiResponse({ url: session.url }))
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to create checkout session'),
      { status: 500 }
    )
  }
}
