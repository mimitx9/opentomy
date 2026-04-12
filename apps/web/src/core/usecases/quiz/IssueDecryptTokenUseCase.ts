import type { ISubscriptionRepository } from '../../ports/outbound/repositories/ISubscriptionRepository'
import type { IAccessRepository } from '../../ports/outbound/repositories/IAccessRepository'
import type { IDecryptTokenRepository } from '../../ports/outbound/repositories/IDecryptTokenRepository'
import type { AccessControlService } from '../../domain/services/AccessControlService'
import type { ICryptoPort } from '../../ports/outbound/ICryptoPort'
import {
  AccessDeniedException,
  ServerMisconfigurationException,
} from '../../domain/exceptions/DomainException'

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
    private readonly crypto: ICryptoPort,
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

    const { token, expiresAt } = await this.crypto.generateDecryptToken(
      serverSecret,
      input.fileId,
      input.userId,
    )

    await this.decryptTokenRepo.create({
      userId: input.userId,
      fileId: input.fileId,
      token,
      expiresAt,
    })

    return { decryptToken: token, expiresAt: expiresAt.toISOString() }
  }
}
