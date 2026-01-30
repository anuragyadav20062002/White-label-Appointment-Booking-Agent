'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BrandingConfig } from '@/types'

export default function BrandingPage() {
  const { tenant, refreshUser } = useAuth()
  const [branding, setBranding] = useState<BrandingConfig>({
    primary_color: '#2563eb',
    secondary_color: '#1e40af',
    company_name: '',
    logo_url: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (tenant?.branding_config) {
      setBranding(tenant.branding_config as BrandingConfig)
    }
  }, [tenant])

  const handleChange = (field: keyof BrandingConfig, value: string) => {
    setBranding((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('tenants')
        .update({ branding_config: branding })
        .eq('id', tenant?.id)

      if (updateError) throw updateError

      setSuccess('Branding updated successfully!')
      refreshUser?.()
    } catch (err) {
      console.error('Error updating branding:', err)
      setError('Failed to update branding')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenant?.id}/logo.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName)

      setBranding((prev) => ({ ...prev, logo_url: publicUrl }))
      setSuccess('Logo uploaded! Remember to save your changes.')
    } catch (err) {
      console.error('Error uploading logo:', err)
      setError('Failed to upload logo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
        <p className="text-gray-500 mt-1">Customize your booking pages and emails</p>
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

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Upload your company logo (max 2MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                {branding.logo_url ? (
                  <img
                    src={branding.logo_url}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Upload Logo
                </label>
                {branding.logo_url && (
                  <button
                    type="button"
                    onClick={() => setBranding((prev) => ({ ...prev, logo_url: '' }))}
                    className="ml-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Company Name</CardTitle>
            <CardDescription>Displayed on booking pages and emails</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={branding.company_name || ''}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="Your Company Name"
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>Customize the look of your booking pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primary_color || '#2563eb'}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <Input
                  value={branding.primary_color || '#2563eb'}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  placeholder="#2563eb"
                  className="w-32 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.secondary_color || '#1e40af'}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <Input
                  value={branding.secondary_color || '#1e40af'}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  placeholder="#1e40af"
                  className="w-32 font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How your branding will appear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-3 mb-4">
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt="Logo" className="h-8 w-auto" />
                ) : (
                  <div
                    className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    {(branding.company_name || 'C')[0]}
                  </div>
                )}
                <span className="font-semibold">{branding.company_name || 'Your Company'}</span>
              </div>
              <div
                className="text-white px-4 py-2 rounded text-center"
                style={{ backgroundColor: branding.primary_color }}
              >
                Book Now
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" isLoading={isLoading}>
          Save Changes
        </Button>
      </form>
    </div>
  )
}
