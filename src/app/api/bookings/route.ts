import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createBookingSchema, validateSchema } from '@/lib/utils/validation'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'
import { addMinutes } from 'date-fns'
import { sendEmail, getConfirmationEmailHtml, AppointmentEmailData } from '@/lib/email'

// GET /api/bookings - List bookings (authenticated)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

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

    // Get client IDs for this tenant
    let query = supabase
      .from('appointments')
      .select('*, clients!inner(tenant_id, name)')
      .eq('clients.tenant_id', userData.tenant_id)
      .order('start_time', { ascending: true })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch appointments'),
        { status: 500 }
      )
    }

    return NextResponse.json(createApiResponse(appointments))
  } catch (error) {
    console.error('GET bookings error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create a booking (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateSchema(createBookingSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid input', validation.errors),
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify client exists and is active
    const { data: clientRaw } = await supabase
      .from('clients')
      .select('*, client_settings(*)')
      .eq('id', body.client_id)
      .eq('is_active', true)
      .single()

    interface ClientWithSettings {
      id: string
      name: string
      slug: string
      tenant_id: string
      client_settings?: Array<{
        appointment_duration: number
        min_notice_hours: number
        max_bookings_per_day: number
      }>
    }

    const client = clientRaw as ClientWithSettings | null

    if (!client) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'Client not found or inactive'),
        { status: 404 }
      )
    }

    const settings = client.client_settings?.[0]
    const duration = settings?.appointment_duration || 30
    const startTime = new Date(body.start_time)
    const endTime = addMinutes(startTime, duration)

    // Check if booking is in the past
    if (startTime < new Date()) {
      return NextResponse.json(
        createApiError(ErrorCodes.BOOKING_IN_PAST, 'Cannot book appointments in the past'),
        { status: 400 }
      )
    }

    // Check minimum notice
    const minNoticeHours = settings?.min_notice_hours || 24
    const minNoticeTime = addMinutes(new Date(), minNoticeHours * 60)
    if (startTime < minNoticeTime) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, `Bookings require at least ${minNoticeHours} hours notice`),
        { status: 400 }
      )
    }

    // Check for conflicts (double booking)
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('client_id', body.client_id)
      .eq('status', 'confirmed')
      .or(`and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        createApiError(ErrorCodes.SLOT_UNAVAILABLE, 'This time slot is no longer available'),
        { status: 409 }
      )
    }

    // Check max bookings per day
    const maxPerDay = settings?.max_bookings_per_day || 10
    const dayStart = new Date(startTime)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(startTime)
    dayEnd.setHours(23, 59, 59, 999)

    const { count: dayBookings } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', body.client_id)
      .eq('status', 'confirmed')
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())

    if ((dayBookings || 0) >= maxPerDay) {
      return NextResponse.json(
        createApiError(ErrorCodes.MAX_BOOKINGS_REACHED, 'Maximum bookings reached for this day'),
        { status: 409 }
      )
    }

    // Create the appointment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appointmentRaw, error } = await (supabase as any)
      .from('appointments')
      .insert({
        client_id: body.client_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone || null,
        notes: body.notes || null,
        status: 'confirmed',
      })
      .select()
      .single()

    const appointment = appointmentRaw as { id: string } | null

    if (error || !appointment) {
      console.error('Error creating appointment:', error)
      return NextResponse.json(
        createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to create appointment'),
        { status: 500 }
      )
    }

    // Send confirmation email (non-blocking)
    try {
      const { data: tenantRaw } = await supabase
        .from('tenants')
        .select('name, primary_color, logo_url')
        .eq('id', client.tenant_id)
        .single()

      const tenant = tenantRaw as { name: string; primary_color: string | null; logo_url: string | null } | null

      if (tenant) {
        const emailData: AppointmentEmailData = {
          customerName: body.customer_name,
          customerEmail: body.customer_email,
          clientName: client.name,
          appointmentDate: startTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          appointmentTime: startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          }),
          appointmentDuration: duration,
          tenantName: tenant.name,
          primaryColor: tenant.primary_color || undefined,
          logoUrl: tenant.logo_url || undefined,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/${client.slug}?cancel=${appointment.id}`,
          rescheduleUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/${client.slug}`,
        }

        // Send email asynchronously (don't block response)
        sendEmail({
          to: body.customer_email,
          subject: `Appointment Confirmed - ${client.name}`,
          html: getConfirmationEmailHtml(emailData),
        }).catch((err) => console.error('Failed to send confirmation email:', err))
      }
    } catch (emailError) {
      console.error('Email preparation error:', emailError)
      // Don't fail the booking if email fails
    }

    // TODO: Create calendar event if connected

    return NextResponse.json(createApiResponse(appointment), { status: 201 })
  } catch (error) {
    console.error('POST booking error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
