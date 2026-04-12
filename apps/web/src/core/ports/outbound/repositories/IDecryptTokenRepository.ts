import type { DecryptToken } from '../../../domain/entities/DecryptToken'

export interface CreateDecryptTokenInput {
  userId: string
  fileId: string
  token: string
  expiresAt: Date
}

export interface IDecryptTokenRepository {
  findValidToken(userId: string, fileId: string): Promise<DecryptToken | null>
  create(input: CreateDecryptTokenInput): Promise<DecryptToken>
}
