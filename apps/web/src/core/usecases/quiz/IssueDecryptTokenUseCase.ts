import type { ISubscriptionRepository } from '../../ports/outbound/repositories/ISubscriptionRepository'
import type { IAccessRepository } from '../../ports/outbound/repositories/IAccessRepository'
import type { IDecryptTokenRepository } from '../../ports/outbound/repositories/IDecryptTokenRepository'
import type { AccessControlService } from '../../domain/services/AccessControlService'
import {
  AccessDeniedException,
  ServerMisconfigurationException,
} from '../../domain/exceptions/DomainException'
import { deriveStableFileToken } from '../files/PackQuizFileUseCase'

export interface IssueDecryptTokenInput {
  fileId: string
  userId: string
}

export interface IssueDecryptTokenOutput {
  decryptToken: string
  expiresAt: string
}

export class IssueDecryptTokenUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly accessRepo: IAccessRepository,
    private readonly decryptTokenRepo: IDecryptTokenRepository,
    private readonly accessControl: AccessControlService,
  ) {}

  async execute(input: IssueDecryptTokenInput): Promise<IssueDecryptTokenOutput> {
    const [subscription, fileAccess] = await Promise.all([
      this.subscriptionRepo.findByUserId(input.userId),
      this.accessRepo.findByUserAndFile(input.userId, input.fileId),
    ])

    const canDecrypt = this.accessControl.canDecryptFile(subscription, fileAccess)
    if (!canDecrypt) {
      throw new AccessDeniedException({
        tier: subscription?.tier ?? 'FREE',
        trialEndsAt: subscription?.trialEndsAt,
        upgradeUrl: '/subscription',
      })
    }

    const serverSecret = process.env.SERVER_DECRYPT_SECRET
    if (!serverSecret) throw new ServerMisconfigurationException()

    // Derive a stable file-level token (same for all authorized users).
    // The .optmy file is packed ONCE with this token, so all decryption calls
    // must use the same token. Access control is already enforced above.
    const stableToken = deriveStableFileToken(serverSecret, input.fileId)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min TTL for DB record

    await this.decryptTokenRepo.create({
      userId: input.userId,
      fileId: input.fileId,
      token: stableToken,
      expiresAt,
    })

    return { decryptToken: stableToken, expiresAt: expiresAt.toISOString() }
  }
}
