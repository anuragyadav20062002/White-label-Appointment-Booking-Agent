import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'
import { createSubscription, getPlanIds, PlanKey } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const PLAN_IDS = getPlanIds()

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

    if (!plan || !PLAN_IDS[plan as PlanKey]) {
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

    // Create Razorpay subscription
    const { subscriptionId, shortUrl } = await createSubscription({
      planId: PLAN_IDS[plan as PlanKey],
      customerEmail: userData.email,
      notes: {
        tenant_id: userData.tenant_id,
        user_id: user.id,
        plan: plan,
      },
    })

    // Store the pending subscription ID for webhook to match
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('subscriptions')
      .update({
        razorpay_subscription_id: subscriptionId,
        plan: plan,
        status: 'incomplete',
      })
      .eq('tenant_id', userData.tenant_id)

    return NextResponse.json(createApiResponse({ url: shortUrl }))
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to create checkout session'),
      { status: 500 }
    )
  }
}
