import type { QuizFileWithAccess } from './file'
import type { UserProfile, UserSubscription } from './user'
import type { QuizAttemptResult } from './quiz'

/** Standard API error response */
export interface ApiError {
  error: string
  code?: string
  upgrade_url?: string
}

/** Standard paginated response */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Auth
export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: UserProfile
  access_token: string
  refresh_token: string
  expires_at: string
}

// Decrypt gate
export interface DecryptRequest {
  file_id: string
}

export interface DecryptResponse {
  decrypt_token: string
  expires_at: string
}

// File upload
export interface FileUploadResponse {
  file_id: string
  message: string
}

// Subscription
export interface SubscriptionStatusResponse {
  subscription: UserSubscription | null
  tier: import('./file').SubscriptionTier
  status: import('./file').SubscriptionStatus | null
  trial_ends_at: string | null
  can_decrypt: boolean
}

export interface CheckoutRequest {
  price_id: string
  success_url: string
  cancel_url: string
}

export interface CheckoutResponse {
  checkout_url: string
}

export interface PortalResponse {
  portal_url: string
}

// Attempt
export interface SubmitAttemptRequest {
  file_id: string
  answers: Array<{
    question_id: string
    selected_index: number | null
    selected_text?: string
    time_spent_ms?: number
  }>
}

export type { QuizFileWithAccess, UserProfile, UserSubscription, QuizAttemptResult }
