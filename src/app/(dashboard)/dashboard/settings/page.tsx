'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface TenantSettings {
  name: string
  email: string
  timezone: string
}

interface UserSettings {
  full_name: string
  email: string
}

export default function SettingsPage() {
  const { user, tenant, signOut } = useAuth()
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({
    name: '',
    email: '',
    timezone: 'America/New_York',
  })
  const [userSettings, setUserSettings] = useState<UserSettings>({
    full_name: '',
    email: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchSettings = async () => {
      if (!tenant?.id || !user?.id) return

      // Fetch tenant settings
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('name, email, timezone')
        .eq('id', tenant.id)
        .single()

      const td = tenantData as { name: string; email: string | null; timezone: string | null } | null
      if (td) {
        setTenantSettings({
          name: td.name || '',
          email: td.email || '',
          timezone: td.timezone || 'America/New_York',
        })
      }

      // Fetch user settings
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      const ud = userData as { full_name: string | null; email: string } | null
      if (ud) {
        setUserSettings({
          full_name: ud.full_name || '',
          email: ud.email || '',
        })
      }

      setIsLoading(false)
    }

    fetchSettings()
  }, [tenant?.id, user?.id, supabase])

  const handleSaveTenant = async () => {
    if (!tenant?.id) return
    setIsSaving(true)
    setMessage(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tenants')
      .update({
        name: tenantSettings.name,
        email: tenantSettings.email,
        timezone: tenantSettings.timezone,
      })
      .eq('id', tenant.id)

    setIsSaving(false)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully' })
    }
  }

  const handleSaveUser = async () => {
    if (!user?.id) return
    setIsSaving(true)
    setMessage(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('users')
      .update({
        full_name: userSettings.full_name,
      })
      .eq('id', user.id)

    setIsSaving(false)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save profile' })
    } else {
      setMessage({ type: 'success', text: 'Profile saved successfully' })
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will delete all your data.'
    )

    if (!confirmed) return

    const doubleConfirmed = window.confirm(
      'This will permanently delete your agency, all clients, and all appointment data. Type "DELETE" to confirm.'
    )

    if (!doubleConfirmed) return

    // In production, this would call an API to handle account deletion
    setMessage({ type: 'error', text: 'Account deletion requires contacting support.' })
  }

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
  ]

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and agency settings</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Agency Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Agency Settings</CardTitle>
          <CardDescription>Configure your agency information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency Name
            </label>
            <Input
              value={tenantSettings.name}
              onChange={(e) =>
                setTenantSettings({ ...tenantSettings, name: e.target.value })
              }
              placeholder="Your Agency Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <Input
              type="email"
              value={tenantSettings.email}
              onChange={(e) =>
                setTenantSettings({ ...tenantSettings, email: e.target.value })
              }
              placeholder="contact@agency.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={tenantSettings.timezone}
              onChange={(e) =>
                setTenantSettings({ ...tenantSettings, timezone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleSaveTenant} isLoading={isSaving}>
            Save Agency Settings
          </Button>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your personal account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input
              value={userSettings.full_name}
              onChange={(e) =>
                setUserSettings({ ...userSettings, full_name: e.target.value })
              }
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={userSettings.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <Button onClick={handleSaveUser} isLoading={isSaving}>
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500">Change your account password</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/auth/forgot-password'
              }}
            >
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Sign Out</p>
              <p className="text-sm text-gray-500">Sign out of your account</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-700">
                Permanently delete your agency and all associated data
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
