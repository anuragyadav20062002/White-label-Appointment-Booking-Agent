import { z } from 'zod'

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
  .optional()

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)')

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')

// ============================================
// AUTH SCHEMAS
// ============================================

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// ============================================
// CLIENT SCHEMAS
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema.optional(),
  phone: phoneSchema,
  timezone: z.string().default('America/New_York'),
})

export const updateClientSchema = createClientSchema.partial()

// ============================================
// BOOKING SCHEMAS
// ============================================

export const createBookingSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  start_time: z.string().datetime('Invalid start time'),
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_email: emailSchema,
  customer_phone: phoneSchema,
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
})

// ============================================
// AVAILABILITY SCHEMAS
// ============================================

export const availabilityRuleSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: timeSchema,
  end_time: timeSchema,
  is_available: z.boolean(),
})

export const clientSettingsSchema = z.object({
  appointment_duration: z.number().min(15).max(480),
  buffer_time: z.number().min(0).max(120),
  max_bookings_per_day: z.number().min(1).max(100),
  min_notice_hours: z.number().min(0).max(168),
  max_advance_days: z.number().min(1).max(365),
})

// ============================================
// BRANDING SCHEMAS
// ============================================

export const updateBrandingSchema = z.object({
  logo_url: z.string().url('Invalid logo URL').optional(),
  primary_color: hexColorSchema.optional(),
  secondary_color: hexColorSchema.optional(),
  company_name: z.string().min(2).optional(),
  custom_domain: z.string().optional(),
})

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string> = {}
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    errors[path] = issue.message
  })

  return { success: false, errors }
}

export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>
export type ClientSettingsInput = z.infer<typeof clientSettingsSchema>
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>
