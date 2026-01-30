'use client'

import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface DashboardStats {
  totalClients: number
  totalAppointments: number
  upcomingAppointments: number
  subscriptionStatus: string
  subscriptionPlan: string
}

export default function DashboardPage() {
  const { user, tenant, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading) return

      if (!tenant?.id) {
        setIsLoading(false)
        return
      }

      try {
        // Get total clients
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        // Get client IDs for this tenant
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .eq('tenant_id', tenant.id)

        const clientIds = (clients as { id: string }[] | null)?.map((c) => c.id) || []

        // Get total appointments
        let totalAppointments = 0
        let upcomingAppointments = 0

        if (clientIds.length > 0) {
          const { count: appointmentCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .in('client_id', clientIds)

          totalAppointments = appointmentCount || 0

          const { count: upcomingCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .in('client_id', clientIds)
            .eq('status', 'confirmed')
            .gte('start_time', new Date().toISOString())

          upcomingAppointments = upcomingCount || 0
        }

        // Get subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status, plan')
          .eq('tenant_id', tenant.id)
          .single()

        const sub = subscription as { status: string; plan: string } | null

        setStats({
          totalClients: clientCount || 0,
          totalAppointments,
          upcomingAppointments,
          subscriptionStatus: sub?.status || 'none',
          subscriptionPlan: sub?.plan || 'none',
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [tenant?.id, authLoading, supabase])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalClients || 0}</p>
            <Link href="/dashboard/clients" className="text-sm text-primary-600 hover:text-primary-500">
              View all clients →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalAppointments || 0}</p>
            <Link href="/dashboard/appointments" className="text-sm text-primary-600 hover:text-primary-500">
              View all bookings →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.upcomingAppointments || 0}</p>
            <p className="text-sm text-gray-500">appointments scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold capitalize">{stats?.subscriptionPlan || 'None'}</p>
            <p className="text-sm">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  stats?.subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : stats?.subscriptionStatus === 'trialing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {stats?.subscriptionStatus || 'None'}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/dashboard/clients/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Add New Client</p>
                <p className="text-sm text-gray-500">Create a new client business</p>
              </div>
            </Link>
            <Link
              href="/dashboard/branding"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Customize Branding</p>
                <p className="text-sm text-gray-500">Update your logo and colors</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${(stats?.totalClients || 0) > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {(stats?.totalClients || 0) > 0 ? '✓' : '1'}
                </div>
                <p className={`text-sm ${(stats?.totalClients || 0) > 0 ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  Create your first client
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm">
                  2
                </div>
                <p className="text-sm text-gray-900">Connect a Google Calendar</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm">
                  3
                </div>
                <p className="text-sm text-gray-900">Share booking link with customers</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm">
                  4
                </div>
                <p className="text-sm text-gray-900">Customize your branding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
