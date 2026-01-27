import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/calendar/callback - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // client_id
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${baseUrl}/dashboard/clients/${state}?error=oauth_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard/clients?error=invalid_callback`)
  }

  const clientId = state

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_SECRET!,
        redirect_uri: `${baseUrl}/api/calendar/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      console.error('Token exchange error:', tokens)
      return NextResponse.redirect(`${baseUrl}/dashboard/clients/${clientId}?error=token_exchange_failed`)
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Store tokens in database
    const supabase = createAdminClient()

    // Check if calendar account already exists
    const { data: existingRaw } = await supabase
      .from('calendar_accounts')
      .select('id, refresh_token')
      .eq('client_id', clientId)
      .single()

    const existing = existingRaw as { id: string; refresh_token: string } | null

    if (existing) {
      // Update existing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('calendar_accounts')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existing.refresh_token, // Keep old refresh if not provided
          token_expires_at: tokenExpiresAt.toISOString(),
          is_connected: true,
        })
        .eq('client_id', clientId)
    } else {
      // Create new
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('calendar_accounts').insert({
        client_id: clientId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokenExpiresAt.toISOString(),
        calendar_id: 'primary',
        is_connected: true,
      })
    }

    return NextResponse.redirect(`${baseUrl}/dashboard/clients/${clientId}?success=calendar_connected`)
  } catch (err) {
    console.error('Calendar callback error:', err)
    return NextResponse.redirect(`${baseUrl}/dashboard/clients/${clientId}?error=connection_failed`)
  }
}
