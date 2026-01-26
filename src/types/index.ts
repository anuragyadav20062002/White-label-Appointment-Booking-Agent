// ============================================
// ENUMS
// ============================================

export enum UserRole {
  AGENCY_OWNER = 'agency_owner',
  CLIENT_ADMIN = 'client_admin',
  STAFF = 'staff',
}

export enum AppointmentStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  PRO = 'pro',
  AGENCY = 'agency',
}

export enum CalendarProvider {
  GOOGLE = 'google',
}

export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

// ============================================
// CORE ENTITIES
// ============================================

export interface Tenant {
  id: string
  name: string
  branding_config: BrandingConfig
  created_at: string
  updated_at: string
}

export interface BrandingConfig {
  logo_url?: string
  primary_color: string
  secondary_color: string
  company_name: string
  custom_domain?: string
}

export interface User {
  id: string
  email: string
  role: UserRole
  tenant_id: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  tenant_id: string
  name: string
  booking_slug: string
  email?: string
  phone?: string
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CalendarAccount {
  id: string
  client_id: string
  provider: CalendarProvider
  access_token: string
  refresh_token: string
  token_expires_at: string
  calendar_id?: string
  is_connected: boolean
  created_at: string
  updated_at: string
}

export interface AvailabilityRule {
  id: string
  client_id: string
  day_of_week: DayOfWeek
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface ClientSettings {
  id: string
  client_id: string
  appointment_duration: number // minutes
  buffer_time: number // minutes
  max_bookings_per_day: number
  min_notice_hours: number // minimum hours before booking
  max_advance_days: number // maximum days in advance
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  client_id: string
  start_time: string
  end_time: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  status: AppointmentStatus
  calendar_event_id?: string
  notes?: string
  cancellation_token: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  tenant_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

// Auth
export interface SignUpRequest {
  email: string
  password: string
  company_name: string
  first_name?: string
  last_name?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  tenant: Tenant
  access_token: string
  refresh_token: string
}

// Clients
export interface CreateClientRequest {
  name: string
  email?: string
  phone?: string
  timezone?: string
}

export interface UpdateClientRequest {
  name?: string
  email?: string
  phone?: string
  timezone?: string
  is_active?: boolean
}

// Bookings
export interface CreateBookingRequest {
  client_id: string
  start_time: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  notes?: string
}

export interface AvailableSlot {
  start_time: string
  end_time: string
}

export interface GetAvailabilityRequest {
  client_id: string
  date: string // YYYY-MM-DD
}

// Branding
export interface UpdateBrandingRequest {
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  company_name?: string
  custom_domain?: string
}

// Availability
export interface UpdateAvailabilityRequest {
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  is_available: boolean
}

export interface UpdateClientSettingsRequest {
  appointment_duration?: number
  buffer_time?: number
  max_bookings_per_day?: number
  min_notice_hours?: number
  max_advance_days?: number
}

// ============================================
// UI TYPES
// ============================================

export interface SelectOption {
  label: string
  value: string
}

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}
