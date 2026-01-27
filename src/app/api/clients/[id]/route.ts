import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateClientSchema, validateSchema } from '@/lib/utils/validation'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'

// GET /api/clients/[id] - Get a single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
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

    // Get client with tenant check
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id)
      .single()

    if (error || !client) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'Client not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(createApiResponse(client))
  } catch (error) {
    console.error('GET client error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// PATCH /api/clients/[id] - Update a client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        createApiError(ErrorCodes.UNAUTHORIZED, 'Not authenticated'),
        { status: 401 }
      )
    }

    // Get user's tenant_id and role
    const { data: userDataRaw } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    const userData = userDataRaw as { tenant_id: string; role: string } | null

    if (!userData) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'User profile not found'),
        { status: 404 }
      )
    }

    // Only agency owners can update clients
    if (userData.role !== 'agency_owner') {
      return NextResponse.json(
        createApiError(ErrorCodes.FORBIDDEN, 'Only agency owners can update clients'),
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = validateSchema(updateClientSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid input', validation.errors),
        { status: 400 }
      )
    }

    // Update client with tenant check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: client, error } = await (supabase as any)
      .from('clients')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        timezone: body.timezone,
        is_active: body.is_active,
      })
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single()

    if (error || !client) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'Client not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(createApiResponse(client))
  } catch (error) {
    console.error('PATCH client error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        createApiError(ErrorCodes.UNAUTHORIZED, 'Not authenticated'),
        { status: 401 }
      )
    }

    // Get user's tenant_id and role
    const { data: userDataRaw } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    const userData = userDataRaw as { tenant_id: string; role: string } | null

    if (!userData) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'User profile not found'),
        { status: 404 }
      )
    }

    // Only agency owners can delete clients
    if (userData.role !== 'agency_owner') {
      return NextResponse.json(
        createApiError(ErrorCodes.FORBIDDEN, 'Only agency owners can delete clients'),
        { status: 403 }
      )
    }

    // Delete client with tenant check
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id)

    if (error) {
      return NextResponse.json(
        createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to delete client'),
        { status: 500 }
      )
    }

    return NextResponse.json(createApiResponse({ success: true }))
  } catch (error) {
    console.error('DELETE client error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
