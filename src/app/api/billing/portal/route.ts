import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'
import { getSubscriptionManageUrl } from '@/lib/razorpay'

export async function POST() {
  try {
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
      .select('razorpay_subscription_id')
      .eq('tenant_id', userData.tenant_id)
      .single()

    const subscription = subscriptionRaw as { razorpay_subscription_id: string } | null

    if (!subscription?.razorpay_subscription_id || subscription.razorpay_subscription_id.startsWith('trial_')) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'No active subscription'),
        { status: 404 }
      )
    }

    // Get subscription management URL from Razorpay
    const portalUrl = await getSubscriptionManageUrl(subscription.razorpay_subscription_id)

    return NextResponse.json(createApiResponse({ url: portalUrl }))
  } catch (error) {
    console.error('Create portal error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to create portal session'),
      { status: 500 }
    )
  }
}
