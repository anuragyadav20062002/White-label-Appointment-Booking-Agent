'use client'

import { useState, useEffect } from 'react'
import { format, addDays, parseISO, isAfter, isBefore, startOfDay, addMinutes } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Client, ClientSettings, AvailabilityRule } from '@/types'

interface BookingFormProps {
  client: Client
  settings: ClientSettings | null
  availability: AvailabilityRule[]
  primaryColor: string
}

interface TimeSlot {
  time: string
  display: string
}

export default function BookingForm({ client, settings, availability, primaryColor }: BookingFormProps) {
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirmation'>('date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingResult, setBookingResult] = useState<{ id: string; cancellation_token: string } | null>(null)

  const duration = settings?.appointment_duration || 30
  const minNotice = settings?.min_notice_hours || 24
  const maxAdvance = settings?.max_advance_days || 30

  // Generate available dates
  const availableDates: Date[] = []
  const today = startOfDay(new Date())
  const minDate = addMinutes(new Date(), minNotice * 60)

  for (let i = 0; i <= maxAdvance; i++) {
    const date = addDays(today, i)
    const dayOfWeek = (date.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
    const rule = availability.find((a) => a.day_of_week === dayOfWeek)

    if (rule?.is_available && isAfter(date, startOfDay(minDate))) {
      availableDates.push(date)
    }
  }

  // Fetch available time slots when date changes
  useEffect(() => {
    if (!selectedDate) return

    const fetchSlots = async () => {
      setIsLoadingSlots(true)
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const response = await fetch(`/api/bookings/availability?client_id=${client.id}&date=${dateStr}`)
        const data = await response.json()

        if (data.data) {
          setAvailableSlots(data.data)
        }
      } catch (err) {
        console.error('Error fetching slots:', err)
        // Fallback: generate slots from availability rules
        const dayOfWeek = (selectedDate.getDay() + 6) % 7
        const rule = availability.find((a) => a.day_of_week === dayOfWeek)

        if (rule) {
          const slots: TimeSlot[] = []
          const [startHour, startMin] = rule.start_time.split(':').map(Number)
          const [endHour, endMin] = rule.end_time.split(':').map(Number)

          let currentMinutes = startHour * 60 + startMin
          const endMinutes = endHour * 60 + endMin

          while (currentMinutes + duration <= endMinutes) {
            const hours = Math.floor(currentMinutes / 60)
            const mins = currentMinutes % 60
            const time = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
            const display = format(new Date(2000, 0, 1, hours, mins), 'h:mm a')
            slots.push({ time, display })
            currentMinutes += duration + (settings?.buffer_time || 0)
          }

          setAvailableSlots(slots)
        }
      } finally {
        setIsLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [selectedDate, client.id, availability, duration, settings?.buffer_time])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setStep('time')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (!selectedDate || !selectedTime) {
        throw new Error('Please select a date and time')
      }

      const startTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(':').map(Number)
      startTime.setHours(hours, minutes, 0, 0)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          start_time: startTime.toISOString(),
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone || undefined,
          notes: formData.notes || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to book appointment')
      }

      setBookingResult(result.data)
      setStep('confirmation')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render based on current step
  if (step === 'confirmation' && bookingResult) {
    const startTime = new Date(selectedDate!)
    const [hours, minutes] = selectedTime!.split(':').map(Number)
    startTime.setHours(hours, minutes)

    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
        <p className="text-gray-600 mb-6">
          Your appointment has been scheduled for<br />
          <strong>{format(startTime, 'EEEE, MMMM d, yyyy')}</strong> at <strong>{format(startTime, 'h:mm a')}</strong>
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Confirmation sent to:</strong><br />
            {formData.email}
          </p>
          <p className="text-sm text-gray-500">
            Check your email for details and cancellation link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['date', 'time', 'details'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'text-white'
                  : ['date', 'time', 'details'].indexOf(step) > i
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
              style={step === s ? { backgroundColor: primaryColor } : {}}
            >
              {['date', 'time', 'details'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            {i < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Date Selection */}
      {step === 'date' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select a Date</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {availableDates.slice(0, 16).map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateSelect(date)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  selectedDate?.toDateString() === date.toDateString()
                    ? 'border-2 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={
                  selectedDate?.toDateString() === date.toDateString()
                    ? { borderColor: primaryColor, backgroundColor: primaryColor }
                    : {}
                }
              >
                <div className="text-xs text-gray-500 font-medium">
                  {format(date, 'EEE')}
                </div>
                <div className="text-lg font-semibold">{format(date, 'd')}</div>
                <div className="text-xs">{format(date, 'MMM')}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time Selection */}
      {step === 'time' && (
        <div>
          <button
            onClick={() => setStep('date')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
          >
            ← Back to date
          </button>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Time</h3>
          <p className="text-sm text-gray-500 mb-4">
            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>

          {isLoadingSlots ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: primaryColor }} />
              <p className="text-sm text-gray-500 mt-2">Loading available times...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No available times on this date</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => handleTimeSelect(slot.time)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedTime === slot.time
                      ? 'border-2 text-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={
                    selectedTime === slot.time
                      ? { borderColor: primaryColor, backgroundColor: primaryColor }
                      : {}
                  }
                >
                  {slot.display}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details Form */}
      {step === 'details' && (
        <div>
          <button
            onClick={() => setStep('time')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
          >
            ← Back to time
          </button>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your Details</h3>
          <p className="text-sm text-gray-500 mb-4">
            {selectedDate && format(selectedDate, 'EEEE, MMMM d')} at{' '}
            {selectedTime && format(new Date(2000, 0, 1, ...selectedTime.split(':').map(Number)), 'h:mm a')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Your Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="John Smith"
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="john@example.com"
              helperText="Confirmation will be sent here"
            />

            <Input
              label="Phone Number (optional)"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-000-0000"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                rows={3}
                placeholder="Anything we should know?"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
              style={{ backgroundColor: primaryColor }}
            >
              Confirm Booking
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
