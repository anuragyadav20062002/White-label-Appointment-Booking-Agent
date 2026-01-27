import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClientSchema, validateSchema } from '@/lib/utils/validation'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'

// GET /api/clients - List all clients for the current tenant
export async function GET() {
  try {
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

    // Get clients
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json(
        createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch clients'),
        { status: 500 }
      )
    }

    return NextResponse.json(createApiResponse(clients))
  } catch (error) {
    console.error('GET clients error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
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

    // Only agency owners can create clients
    if (userData.role !== 'agency_owner') {
      return NextResponse.json(
        createApiError(ErrorCodes.FORBIDDEN, 'Only agency owners can create clients'),
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = validateSchema(createClientSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid input', validation.errors),
        { status: 400 }
      )
    }

    // Generate booking slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: slugData } = await (supabase as any).rpc('generate_booking_slug', {
      business_name: body.name,
    })

    const bookingSlug = slugData || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Create client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: client, error } = await (supabase as any)
      .from('clients')
      .insert({
        tenant_id: userData.tenant_id,
        name: body.name,
        booking_slug: bookingSlug,
        email: body.email || null,
        phone: body.phone || null,
        timezone: body.timezone || 'America/New_York',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          createApiError(ErrorCodes.ALREADY_EXISTS, 'A client with this booking URL already exists'),
          { status: 409 }
        )
      }
      return NextResponse.json(
        createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to create client'),
        { status: 500 }
      )
    }

    return NextResponse.json(createApiResponse(client), { status: 201 })
  } catch (error) {
    console.error('POST clients error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
