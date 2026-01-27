'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Database } from '@/types/database'

type AppointmentStatus = Database['public']['Enums']['appointment_status']
type Appointment = Database['public']['Tables']['appointments']['Row']

interface AppointmentWithClient extends Appointment {
  clients: {
    name: string
    slug: string
  }
}

export default function AppointmentsPage() {
  const { tenant } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const supabase = createClient()

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!tenant?.id) return

      const now = new Date().toISOString()
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clients!inner (
            name,
            slug,
            tenant_id
          )
        `)
        .eq('clients.tenant_id', tenant.id)
        .order('start_time', { ascending: filter === 'upcoming' })

      if (filter === 'upcoming') {
        query = query.gte('start_time', now)
      } else if (filter === 'past') {
        query = query.lt('start_time', now)
      }

      const { data, error } = await query.limit(50)

      if (error) {
        console.error('Error fetching appointments:', error)
      } else {
        setAppointments(data as AppointmentWithClient[])
      }
      setIsLoading(false)
    }

    fetchAppointments()
  }, [tenant?.id, filter, supabase])

  const updateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
      )
    }
  }

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage all your client appointments</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['upcoming', 'past', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No appointments</h3>
            <p className="mt-2 text-gray-500">
              {filter === 'upcoming'
                ? 'No upcoming appointments scheduled.'
                : filter === 'past'
                ? 'No past appointments found.'
                : 'No appointments found.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const { date, time } = formatDateTime(appointment.start_time)
            const endTime = formatDateTime(appointment.end_time).time

            return (
              <Card key={appointment.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[80px]">
                        <p className="text-sm font-medium text-gray-500">{date}</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {time}
                        </p>
                        <p className="text-xs text-gray-400">to {endTime}</p>
                      </div>
                      <div className="border-l pl-4">
                        <p className="font-medium text-gray-900">
                          {appointment.customer_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.customer_email}
                        </p>
                        {appointment.customer_phone && (
                          <p className="text-sm text-gray-500">
                            {appointment.customer_phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Client: {appointment.clients.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status.replace('_', ' ')}
                      </span>
                      {appointment.status === 'confirmed' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAppointmentStatus(appointment.id, 'completed')
                            }
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAppointmentStatus(appointment.id, 'no_show')
                            }
                          >
                            No Show
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAppointmentStatus(appointment.id, 'cancelled')
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {appointment.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
