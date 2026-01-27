'use client'

import { createClient } from '@/lib/supabase/client'
import { User, Tenant, UserRole } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

interface AuthState {
  user: User | null
  tenant: Tenant | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    isLoading: true,
    isAuthenticated: false,
  })
  const router = useRouter()
  const supabase = createClient()

  const fetchUserData = useCallback(async (authUserId: string) => {
    try {
      // Get user profile
      const { data: userDataRaw, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single()

      const userData = userDataRaw as (User & { tenant_id: string }) | null

      if (userError || !userData) {
        setState({
          user: null,
          tenant: null,
          isLoading: false,
          isAuthenticated: false,
        })
        return
      }

      // Get tenant
      const { data: tenantDataRaw, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single()

      const tenantData = tenantDataRaw as Tenant | null

      if (tenantError) {
        console.error('Error fetching tenant:', tenantError)
      }

      setState({
        user: userData,
        tenant: tenantData,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
      setState({
        user: null,
        tenant: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }, [supabase])

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserData(session.user.id)
      } else {
        setState({
          user: null,
          tenant: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserData(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            tenant: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserData, supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const hasRole = (role: UserRole): boolean => {
    return state.user?.role === role
  }

  const isAgencyOwner = (): boolean => {
    return hasRole(UserRole.AGENCY_OWNER)
  }

  const isClientAdmin = (): boolean => {
    return hasRole(UserRole.CLIENT_ADMIN)
  }

  return {
    ...state,
    signOut,
    hasRole,
    isAgencyOwner,
    isClientAdmin,
    refreshUser: () => state.user && fetchUserData(state.user.id),
  }
}
