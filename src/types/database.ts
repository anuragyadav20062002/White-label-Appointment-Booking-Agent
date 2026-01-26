// ============================================
// SUPABASE DATABASE TYPES
// Generated types for Supabase tables
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          branding_config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          branding_config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          branding_config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'agency_owner' | 'client_admin' | 'staff'
          tenant_id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'agency_owner' | 'client_admin' | 'staff'
          tenant_id: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'agency_owner' | 'client_admin' | 'staff'
          tenant_id?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
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
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          booking_slug: string
          email?: string | null
          phone?: string | null
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          booking_slug?: string
          email?: string | null
          phone?: string | null
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      calendar_accounts: {
        Row: {
          id: string
          client_id: string
          provider: 'google'
          access_token: string
          refresh_token: string
          token_expires_at: string
          calendar_id: string | null
          is_connected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          provider: 'google'
          access_token: string
          refresh_token: string
          token_expires_at: string
          calendar_id?: string | null
          is_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          provider?: 'google'
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          calendar_id?: string | null
          is_connected?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      availability_rules: {
        Row: {
          id: string
          client_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      client_settings: {
        Row: {
          id: string
          client_id: string
          appointment_duration: number
          buffer_time: number
          max_bookings_per_day: number
          min_notice_hours: number
          max_advance_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          appointment_duration?: number
          buffer_time?: number
          max_bookings_per_day?: number
          min_notice_hours?: number
          max_advance_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          appointment_duration?: number
          buffer_time?: number
          max_bookings_per_day?: number
          min_notice_hours?: number
          max_advance_days?: number
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          client_id: string
          start_time: string
          end_time: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          calendar_event_id: string | null
          notes: string | null
          cancellation_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          start_time: string
          end_time: string
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          status?: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          calendar_event_id?: string | null
          notes?: string | null
          cancellation_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          start_time?: string
          end_time?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          status?: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          calendar_event_id?: string | null
          notes?: string | null
          cancellation_token?: string
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          tenant_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          plan: 'basic' | 'pro' | 'agency'
          status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          plan: 'basic' | 'pro' | 'agency'
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          stripe_subscription_id?: string
          stripe_customer_id?: string
          plan?: 'basic' | 'pro' | 'agency'
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'agency_owner' | 'client_admin' | 'staff'
      appointment_status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
      subscription_status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete'
      subscription_plan: 'basic' | 'pro' | 'agency'
      calendar_provider: 'google'
    }
  }
}
