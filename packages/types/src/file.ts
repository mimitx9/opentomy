export type FileAccessType = 'PURCHASED' | 'SUBSCRIPTION' | 'GIFTED' | 'TRIAL'

export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE'

export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID'
  | 'INCOMPLETE'

/** Plaintext metadata from .optmy file header (not encrypted) */
export interface OptmyFileHeader {
  file_id: string
  creator_user_id: string
  title: string
  description?: string
  question_count: number
  created_at: string
  content_version: number
  thumbnail_url?: string | null
  tags: string[]
  schema_version: string
}

/** Flags byte bit positions */
export const OptmyFlags = {
  REQUIRES_LICENSE:   0b00000001,
  SUBSCRIPTION_ONLY:  0b00000010,
  TRIAL_ELIGIBLE:     0b00000100,
} as const

/** File record as stored in DB / returned by API */
export interface QuizFileRecord {
  id: string
  creatorId: string
  title: string
  description?: string | null
  questionCount: number
  tags: string[]
  thumbnailUrl?: string | null
  fileSize: number
  contentVersion: number
  isPublic: boolean
  downloadCount: number
  createdAt: string
  updatedAt: string
}

/** File with access info for the current user */
export interface QuizFileWithAccess extends QuizFileRecord {
  access: {
    hasAccess: boolean
    accessType?: FileAccessType
    expiresAt?: string | null
    reason?: string
  }
}
