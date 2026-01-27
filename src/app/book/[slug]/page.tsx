import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BookingForm from './booking-form'

// Force dynamic rendering to avoid SSG issues with Supabase
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function BookingPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch client by booking slug
  const { data: clientRaw } = await supabase
    .from('clients')
    .select('*, client_settings(*)')
    .eq('booking_slug', slug)
    .eq('is_active', true)
    .single()

  interface ClientWithSettings {
    id: string
    tenant_id: string
    name: string
    booking_slug: string
    email: string | null
    phone: string | null
    timezone: string
    is_active: boolean
    created_at: string
    updated_at: string
    client_settings: Array<{
      id: string
      client_id: string
      appointment_duration: number
      buffer_time: number
      max_bookings_per_day: number
      min_notice_hours: number
      max_advance_days: number
      created_at: string
      updated_at: string
    }> | null
  }

  const client = clientRaw as unknown as ClientWithSettings | null

  if (!client) {
    notFound()
  }

  // Fetch tenant for branding
  const { data: tenantRaw } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', client.tenant_id)
    .single()

  interface TenantBranding {
    id: string
    name: string
    branding_config?: {
      primary_color: string
      secondary_color: string
      company_name?: string
      logo_url?: string
    } | null
  }

  const tenant = tenantRaw as unknown as TenantBranding | null

  // Fetch availability rules
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: availability } = await (supabase as any)
    .from('availability_rules')
    .select('*')
    .eq('client_id', client.id)
    .order('day_of_week')

  const branding = tenant?.branding_config || {
    primary_color: '#2563eb',
    secondary_color: '#1e40af',
    company_name: client.name,
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        '--color-primary-600': branding.primary_color,
        '--color-primary-700': branding.secondary_color,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {branding.logo_url && (
              <img
                src={branding.logo_url}
                alt={branding.company_name || client.name}
                className="h-10 w-auto"
              />
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {client.name}
              </h1>
              {branding.company_name && branding.company_name !== client.name && (
                <p className="text-sm text-gray-500">Powered by {branding.company_name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Book an Appointment
          </h2>

          <BookingForm
            client={{
              ...client,
              email: client.email ?? undefined,
              phone: client.phone ?? undefined,
            }}
            settings={client.client_settings?.[0] || null}
            availability={availability || []}
            primaryColor={branding.primary_color}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          {branding.company_name && (
            <p>Powered by {branding.company_name}</p>
          )}
        </div>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: clientRaw } = await supabase
    .from('clients')
    .select('name')
    .eq('booking_slug', slug)
    .single()

  const client = clientRaw as { name: string } | null

  return {
    title: client ? `Book with ${client.name}` : 'Book Appointment',
    description: client ? `Schedule an appointment with ${client.name}` : 'Schedule an appointment',
  }
}
