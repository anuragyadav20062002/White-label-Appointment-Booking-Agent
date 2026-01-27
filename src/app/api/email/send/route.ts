import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  sendEmail,
  getConfirmationEmailHtml,
  getReminderEmailHtml,
  getCancellationEmailHtml,
  AppointmentEmailData,
} from '@/lib/email'

type EmailType = 'confirmation' | 'reminder' | 'cancellation'

export async function POST(request: NextRequest) {
  try {
    // Verify internal API key for cron jobs
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, type } = body as { appointmentId: string; type: EmailType }

    if (!appointmentId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get appointment with client and tenant details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (
          id,
          name,
          slug,
          tenant_id,
          tenants (
            id,
            name,
            primary_color,
            logo_url
          ),
          client_settings (
            default_duration
          )
        )
      `)
      .eq('id', appointmentId)
      .single()

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    interface AppointmentWithRelations {
      id: string
      start_time: string
      end_time: string
      customer_name: string
      customer_email: string
      clients: {
        id: string
        name: string
        slug: string
        tenant_id: string
        tenants: {
          id: string
          name: string
          primary_color: string | null
          logo_url: string | null
        }
        client_settings?: Array<{ default_duration: number }>
      }
    }

    const typedAppointment = appointment as unknown as AppointmentWithRelations
    const client = typedAppointment.clients
    const tenant = client.tenants
    const settings = client.client_settings?.[0]

    const startDate = new Date(typedAppointment.start_time)
    const endDate = new Date(typedAppointment.end_time)
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000)

    const emailData: AppointmentEmailData = {
      customerName: typedAppointment.customer_name,
      customerEmail: typedAppointment.customer_email,
      clientName: client.name,
      appointmentDate: startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      appointmentTime: startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      appointmentDuration: duration,
      tenantName: tenant.name,
      primaryColor: tenant.primary_color || undefined,
      logoUrl: tenant.logo_url || undefined,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/${client.slug}?cancel=${typedAppointment.id}`,
      rescheduleUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/${client.slug}`,
    }

    let html: string
    let subject: string

    switch (type) {
      case 'confirmation':
        html = getConfirmationEmailHtml(emailData)
        subject = `Appointment Confirmed - ${client.name}`
        break
      case 'reminder':
        html = getReminderEmailHtml(emailData)
        subject = `Appointment Reminder - ${client.name}`
        break
      case 'cancellation':
        html = getCancellationEmailHtml(emailData)
        subject = `Appointment Cancelled - ${client.name}`
        break
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    const success = await sendEmail({
      to: typedAppointment.customer_email,
      subject,
      html,
    })

    if (!success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
