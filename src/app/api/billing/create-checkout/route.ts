import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'
import { createCheckout, getVariantIds, PlanKey } from '@/lib/lemonsqueezy'

export async function POST(request: NextRequest) {
  try {
    const VARIANT_IDS = getVariantIds()

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

    if (!plan || !VARIANT_IDS[plan as PlanKey]) {
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

    // Create LemonSqueezy checkout
    const { checkoutUrl } = await createCheckout({
      variantId: VARIANT_IDS[plan as PlanKey],
      customData: {
        tenant_id: userData.tenant_id,
        user_id: user.id,
        plan: plan,
      },
      customerEmail: userData.email,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    })

    return NextResponse.json(createApiResponse({ url: checkoutUrl }))
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to create checkout session'),
      { status: 500 }
    )
  }
}
