'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Client, ClientSettings, AvailabilityRule, CalendarAccount } from '@/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const supabase = createClient()

  const [client, setClient] = useState<Client | null>(null)
  const [settings, setSettings] = useState<ClientSettings | null>(null)
  const [availability, setAvailability] = useState<AvailabilityRule[]>([])
  const [calendar, setCalendar] = useState<CalendarAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch client
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single()

        if (clientData) {
          setClient(clientData as Client)
        }

        // Fetch settings
        const { data: settingsData } = await supabase
          .from('client_settings')
          .select('*')
          .eq('client_id', clientId)
          .single()

        if (settingsData) {
          setSettings(settingsData as ClientSettings)
        }

        // Fetch availability
        const { data: availabilityData } = await supabase
          .from('availability_rules')
          .select('*')
          .eq('client_id', clientId)
          .order('day_of_week')

        if (availabilityData) {
          setAvailability(availabilityData as AvailabilityRule[])
        }

        // Fetch calendar
        const { data: calendarData } = await supabase
          .from('calendar_accounts')
          .select('*')
          .eq('client_id', clientId)
          .single()

        if (calendarData) {
          setCalendar(calendarData as CalendarAccount)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [clientId, supabase])

  const handleSettingsChange = (field: keyof ClientSettings, value: number) => {
    if (settings) {
      setSettings({ ...settings, [field]: value })
    }
  }

  const handleAvailabilityChange = (dayIndex: number, field: string, value: string | boolean) => {
    setAvailability((prev) =>
      prev.map((rule) =>
        rule.day_of_week === dayIndex ? { ...rule, [field]: value } : rule
      )
    )
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Update settings
      if (settings) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: settingsError } = await (supabase as any)
          .from('client_settings')
          .update({
            appointment_duration: settings.appointment_duration,
            buffer_time: settings.buffer_time,
            max_bookings_per_day: settings.max_bookings_per_day,
            min_notice_hours: settings.min_notice_hours,
            max_advance_days: settings.max_advance_days,
          })
          .eq('client_id', clientId)

        if (settingsError) throw settingsError
      }

      // Update availability
      for (const rule of availability) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: availError } = await (supabase as any)
          .from('availability_rules')
          .update({
            start_time: rule.start_time,
            end_time: rule.end_time,
            is_available: rule.is_available,
          })
          .eq('id', rule.id)

        if (availError) throw availError
      }

      setSuccess('Settings saved successfully!')
    } catch (err) {
      console.error('Error saving:', err)
      setError('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const connectCalendar = () => {
    // Redirect to Google OAuth
    window.location.href = `/api/calendar/connect?client_id=${clientId}`
  }

  const disconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect the calendar?')) return

    const { error } = await supabase
      .from('calendar_accounts')
      .delete()
      .eq('client_id', clientId)

    if (!error) {
      setCalendar(null)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Client not found</p>
        <Link href="/dashboard/clients">
          <Button variant="outline" className="mt-4">Back to Clients</Button>
        </Link>
      </div>
    )
  }

  const bookingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${client.booking_slug}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/clients" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
            ← Back to Clients
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-500 mt-1">Manage booking settings and calendar</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/book/${client.booking_slug}`} target="_blank">
            <Button variant="outline">View Booking Page →</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Booking URL */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Link</CardTitle>
          <CardDescription>Share this link with customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={bookingUrl} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(bookingUrl)
                setSuccess('Link copied to clipboard!')
                setTimeout(() => setSuccess(null), 2000)
              }}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>Connect Google Calendar to sync availability</CardDescription>
        </CardHeader>
        <CardContent>
          {calendar?.is_connected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Google Calendar Connected</p>
                  <p className="text-sm text-gray-500">Calendar: {calendar.calendar_id || 'Primary'}</p>
                </div>
              </div>
              <Button variant="outline" onClick={disconnectCalendar}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">No Calendar Connected</p>
                  <p className="text-sm text-gray-500">Connect to prevent double bookings</p>
                </div>
              </div>
              <Button onClick={connectCalendar}>
                Connect Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Settings</CardTitle>
          <CardDescription>Configure appointment duration and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Duration (minutes)
              </label>
              <Input
                type="number"
                value={settings?.appointment_duration || 30}
                onChange={(e) => handleSettingsChange('appointment_duration', parseInt(e.target.value))}
                min={15}
                max={480}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buffer Time (minutes)
              </label>
              <Input
                type="number"
                value={settings?.buffer_time || 15}
                onChange={(e) => handleSettingsChange('buffer_time', parseInt(e.target.value))}
                min={0}
                max={120}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Bookings Per Day
              </label>
              <Input
                type="number"
                value={settings?.max_bookings_per_day || 10}
                onChange={(e) => handleSettingsChange('max_bookings_per_day', parseInt(e.target.value))}
                min={1}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Notice (hours)
              </label>
              <Input
                type="number"
                value={settings?.min_notice_hours || 24}
                onChange={(e) => handleSettingsChange('min_notice_hours', parseInt(e.target.value))}
                min={0}
                max={168}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>Set working hours for each day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availability.map((rule, index) => (
              <div key={rule.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                <div className="w-28">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.is_available}
                      onChange={(e) => handleAvailabilityChange(index, 'is_available', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium">{DAYS[index]}</span>
                  </label>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={rule.start_time}
                    onChange={(e) => handleAvailabilityChange(index, 'start_time', e.target.value)}
                    disabled={!rule.is_available}
                    className="w-32"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={rule.end_time}
                    onChange={(e) => handleAvailabilityChange(index, 'end_time', e.target.value)}
                    disabled={!rule.is_available}
                    className="w-32"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} isLoading={isSaving}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
