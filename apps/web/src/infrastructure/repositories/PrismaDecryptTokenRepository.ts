import { prisma } from '@opentomy/db'
import type {
  IDecryptTokenRepository,
  CreateDecryptTokenInput,
} from '../../core/ports/outbound/repositories/IDecryptTokenRepository'
import type { DecryptToken } from '../../core/domain/entities/DecryptToken'

export class PrismaDecryptTokenRepository implements IDecryptTokenRepository {
  async findValidToken(userId: string, fileId: string): Promise<DecryptToken | null> {
    return prisma.decryptToken.findFirst({
      where: {
        userId,
        fileId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    }) as Promise<DecryptToken | null>
  }

  async create(input: CreateDecryptTokenInput): Promise<DecryptToken> {
    return prisma.decryptToken.create({ data: input }) as Promise<DecryptToken>
  }
}
