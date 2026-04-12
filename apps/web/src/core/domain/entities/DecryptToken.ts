export interface DecryptToken {
  id: string
  userId: string
  fileId: string
  token: string
  usedAt?: Date | null
  expiresAt: Date
  createdAt: Date
}
