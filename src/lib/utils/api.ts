import { ApiError, ApiResponse } from '@/types'

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return { data }
}

export function createApiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    error: { code, message, details },
  }
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Booking errors
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  DOUBLE_BOOKING: 'DOUBLE_BOOKING',
  BOOKING_IN_PAST: 'BOOKING_IN_PAST',
  MAX_BOOKINGS_REACHED: 'MAX_BOOKINGS_REACHED',

  // Calendar errors
  CALENDAR_NOT_CONNECTED: 'CALENDAR_NOT_CONNECTED',
  CALENDAR_SYNC_FAILED: 'CALENDAR_SYNC_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Subscription errors
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  PLAN_LIMIT_REACHED: 'PLAN_LIMIT_REACHED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export function handleApiError(error: unknown): ApiResponse<never> {
  console.error('API Error:', error)

  if (error instanceof Error) {
    return createApiError(ErrorCodes.INTERNAL_ERROR, error.message)
  }

  return createApiError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred')
}
