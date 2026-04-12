export type FileAccessType = 'PURCHASED' | 'SUBSCRIPTION' | 'GIFTED' | 'TRIAL'

export interface FileAccess {
  id: string
  userId: string
  fileId: string
  accessType: FileAccessType
  grantedAt: Date
  expiresAt?: Date | null
  grantedById?: string | null
}
