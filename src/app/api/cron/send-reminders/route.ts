import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, getReminderEmailHtml, AppointmentEmailData } from '@/lib/email'
import { addHours } from 'date-fns'

// This endpoint should be called by a cron job every hour
// It sends reminders for appointments happening in the next 24 hours

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret or API key
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Find appointments in the next 24-25 hours that haven't been reminded yet
    const now = new Date()
    const reminderWindowStart = addHours(now, 23)
    const reminderWindowEnd = addHours(now, 25)

    // Get appointments that need reminders
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        customer_name,
        customer_email,
        reminder_sent,
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
          )
        )
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gte('start_time', reminderWindowStart.toISOString())
      .lte('start_time', reminderWindowEnd.toISOString())

    if (error) {
      console.error('Error fetching appointments for reminders:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: 'No reminders to send', count: 0 })
    }

    interface AppointmentWithClient {
      id: string
      start_time: string
      end_time: string
      customer_name: string
      customer_email: string
      reminder_sent: boolean
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
      }
    }

    const typedAppointments = appointments as unknown as AppointmentWithClient[]

    let sentCount = 0
    const errors: string[] = []

    for (const appointment of typedAppointments) {
      try {
        const client = appointment.clients as {
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
        }
        const tenant = client.tenants

        const startTime = new Date(appointment.start_time)
        const endTime = new Date(appointment.end_time)
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

        const emailData: AppointmentEmailData = {
          customerName: appointment.customer_name,
          customerEmail: appointment.customer_email,
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
        }

        const success = await sendEmail({
          to: appointment.customer_email,
          subject: `Reminder: Appointment Tomorrow with ${client.name}`,
          html: getReminderEmailHtml(emailData),
        })

        if (success) {
          // Mark reminder as sent
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('appointments')
            .update({ reminder_sent: true })
            .eq('id', appointment.id)

          sentCount++
        } else {
          errors.push(`Failed to send reminder for appointment ${appointment.id}`)
        }
      } catch (err) {
        errors.push(`Error processing appointment ${appointment.id}: ${err}`)
      }
    }

    return NextResponse.json({
      message: `Sent ${sentCount} reminders`,
      count: sentCount,
      total: appointments.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Reminder cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
