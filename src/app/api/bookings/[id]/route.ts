import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'

// GET /api/bookings/[id] - Get a single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    const supabase = createAdminClient()

    // If token provided, allow public access (for cancellation link)
    if (token) {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('*, clients(name, timezone)')
        .eq('id', id)
        .eq('cancellation_token', token)
        .single()

      if (error || !appointment) {
        return NextResponse.json(
          createApiError(ErrorCodes.NOT_FOUND, 'Appointment not found'),
          { status: 404 }
        )
      }

      return NextResponse.json(createApiResponse(appointment))
    }

    // Otherwise, require authentication
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        createApiError(ErrorCodes.UNAUTHORIZED, 'Not authenticated'),
        { status: 401 }
      )
    }

    // Get user's tenant_id
    const { data: userDataRaw } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const userData = userDataRaw as { tenant_id: string } | null

    if (!userData) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'User profile not found'),
        { status: 404 }
      )
    }

    // Get appointment with tenant check
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*, clients!inner(tenant_id, name, timezone)')
      .eq('id', id)
      .eq('clients.tenant_id', userData.tenant_id)
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'Appointment not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(createApiResponse(appointment))
  } catch (error) {
    console.error('GET booking error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// PATCH /api/bookings/[id] - Update/cancel a booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    const supabase = createAdminClient()

    // If cancellation via token (public)
    if (token && body.status === 'cancelled') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: appointment, error } = await (supabase as any)
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('cancellation_token', token)
        .eq('status', 'confirmed')
        .select()
        .single()

      if (error || !appointment) {
        return NextResponse.json(
          createApiError(ErrorCodes.NOT_FOUND, 'Appointment not found or already cancelled'),
          { status: 404 }
        )
      }

      // TODO: Send cancellation email
      // TODO: Delete calendar event if exists

      return NextResponse.json(createApiResponse(appointment))
    }

    // Otherwise, require authentication
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        createApiError(ErrorCodes.UNAUTHORIZED, 'Not authenticated'),
        { status: 401 }
      )
    }

    // Get user's tenant_id
    const { data: userDataRaw } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const userData = userDataRaw as { tenant_id: string } | null

    if (!userData) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'User profile not found'),
        { status: 404 }
      )
    }

    // Verify appointment belongs to tenant
    const { data: existing } = await supabase
      .from('appointments')
      .select('*, clients!inner(tenant_id)')
      .eq('id', id)
      .eq('clients.tenant_id', userData.tenant_id)
      .single()

    if (!existing) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'Appointment not found'),
        { status: 404 }
      )
    }

    // Update appointment
    const updateData: Record<string, unknown> = {}
    if (body.status) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appointment, error } = await (supabase as any)
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to update appointment'),
        { status: 500 }
      )
    }

    return NextResponse.json(createApiResponse(appointment))
  } catch (error) {
    console.error('PATCH booking error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
