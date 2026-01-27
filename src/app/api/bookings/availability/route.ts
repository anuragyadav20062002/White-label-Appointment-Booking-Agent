import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createApiError, createApiResponse, ErrorCodes } from '@/lib/utils/api'
import { addMinutes, format, parse, isAfter, startOfDay, addDays } from 'date-fns'

// GET /api/bookings/availability - Get available time slots (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const dateStr = searchParams.get('date') // YYYY-MM-DD

    if (!clientId || !dateStr) {
      return NextResponse.json(
        createApiError(ErrorCodes.VALIDATION_ERROR, 'client_id and date are required'),
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get client and settings
    const { data: clientRaw } = await supabase
      .from('clients')
      .select('*, client_settings(*)')
      .eq('id', clientId)
      .eq('is_active', true)
      .single()

    interface ClientWithSettings {
      id: string
      client_settings?: Array<{
        appointment_duration: number
        buffer_time: number
        min_notice_hours: number
      }>
    }

    const client = clientRaw as ClientWithSettings | null

    if (!client) {
      return NextResponse.json(
        createApiError(ErrorCodes.NOT_FOUND, 'Client not found'),
        { status: 404 }
      )
    }

    const settings = client.client_settings?.[0]
    const duration = settings?.appointment_duration || 30
    const bufferTime = settings?.buffer_time || 15
    const minNoticeHours = settings?.min_notice_hours || 24

    // Parse the date
    const targetDate = parse(dateStr, 'yyyy-MM-dd', new Date())
    const dayOfWeek = (targetDate.getDay() + 6) % 7 // Convert to Monday=0

    // Get availability rules for this day
    const { data: availabilityRulesRaw } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('client_id', clientId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single()

    const availabilityRules = availabilityRulesRaw as { start_time: string; end_time: string } | null

    if (!availabilityRules) {
      return NextResponse.json(createApiResponse([]))
    }

    // Get existing appointments for this day
    const dayStart = startOfDay(targetDate)
    const dayEnd = addDays(dayStart, 1)

    const { data: existingAppointmentsRaw } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('client_id', clientId)
      .eq('status', 'confirmed')
      .gte('start_time', dayStart.toISOString())
      .lt('start_time', dayEnd.toISOString())

    const existingAppointments = existingAppointmentsRaw as { start_time: string; end_time: string }[] | null

    // Generate time slots
    const slots: { time: string; display: string }[] = []
    const [startHour, startMin] = availabilityRules.start_time.split(':').map(Number)
    const [endHour, endMin] = availabilityRules.end_time.split(':').map(Number)

    let currentTime = new Date(targetDate)
    currentTime.setHours(startHour, startMin, 0, 0)

    const endTime = new Date(targetDate)
    endTime.setHours(endHour, endMin, 0, 0)

    const now = new Date()
    const minNoticeTime = addMinutes(now, minNoticeHours * 60)

    while (addMinutes(currentTime, duration) <= endTime) {
      const slotStart = new Date(currentTime)
      const slotEnd = addMinutes(slotStart, duration)

      // Check if slot is in the future with enough notice
      if (isAfter(slotStart, minNoticeTime)) {
        // Check for conflicts with existing appointments
        const hasConflict = existingAppointments?.some((apt) => {
          const aptStart = new Date(apt.start_time)
          const aptEnd = new Date(apt.end_time)
          // Add buffer time to existing appointments
          const aptStartWithBuffer = addMinutes(aptStart, -bufferTime)
          const aptEndWithBuffer = addMinutes(aptEnd, bufferTime)

          return slotStart < aptEndWithBuffer && slotEnd > aptStartWithBuffer
        })

        if (!hasConflict) {
          slots.push({
            time: format(slotStart, 'HH:mm'),
            display: format(slotStart, 'h:mm a'),
          })
        }
      }

      // Move to next slot (duration + buffer)
      currentTime = addMinutes(currentTime, duration + bufferTime)
    }

    return NextResponse.json(createApiResponse(slots))
  } catch (error) {
    console.error('GET availability error:', error)
    return NextResponse.json(
      createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
