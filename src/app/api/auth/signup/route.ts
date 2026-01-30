import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { signUpSchema, validateSchema } from '@/lib/utils/validation'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateSchema(signUpSchema, {
      email: body.email,
      password: body.password,
      company_name: body.companyName,
      first_name: body.firstName,
      last_name: body.lastName,
    })

    if (!validation.success) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid input', validation.errors),
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        createApiError(ErrorCodes.ALREADY_EXISTS, 'An account with this email already exists'),
        { status: 409 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: false, // Send verification email
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        createApiError(ErrorCodes.INTERNAL_ERROR, authError?.message || 'Failed to create account'),
        { status: 500 }
      )
    }

    // Create tenant (agency)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tenantData, error: tenantError } = await (supabase as any)
      .from('tenants')
      .insert({
        name: body.companyName,
        branding_config: {
          primary_color: '#2563eb',
          secondary_color: '#1e40af',
          company_name: body.companyName,
          logo_url: null,
        },
      })
      .select()
      .single()

    const tenant = tenantData as { id: string; name: string } | null

    if (tenantError || !tenant) {
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error('Tenant error:', tenantError)
      return NextResponse.json(
        createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to create organization'),
        { status: 500 }
      )
    }

    // Create user profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData, error: userError } = await (supabase as any)
      .from('users')
      .insert({
        id: authData.user.id,
        email: body.email,
        role: 'agency_owner',
        tenant_id: tenant.id,
        first_name: body.firstName || null,
        last_name: body.lastName || null,
        email_verified: true,
      })
      .select()
      .single()

    const user = userData as { id: string; email: string; role: string; tenant_id: string } | null

    if (userError || !user) {
      // Rollback: delete tenant and auth user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('tenants').delete().eq('id', tenant.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error('User error:', userError)
      return NextResponse.json(
        createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to create user profile'),
        { status: 500 }
      )
    }

    // Create default subscription (trialing)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('subscriptions').insert({
      tenant_id: tenant.id,
      razorpay_subscription_id: `trial_${tenant.id}`,
      razorpay_customer_id: `pending_${tenant.id}`,
      plan: 'basic',
      status: 'trialing',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    })

    return NextResponse.json(
      createApiResponse({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
