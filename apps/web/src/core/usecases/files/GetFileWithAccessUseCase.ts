import type { IFileRepository } from '../../ports/outbound/repositories/IFileRepository'
import type { ISubscriptionRepository } from '../../ports/outbound/repositories/ISubscriptionRepository'
import type { IAccessRepository } from '../../ports/outbound/repositories/IAccessRepository'
import type { AccessControlService } from '../../domain/services/AccessControlService'
import type { QuizFile } from '../../domain/entities/QuizFile'
import type { FileAccessType } from '../../domain/entities/FileAccess'
import { NotFoundException } from '../../domain/exceptions/DomainException'

export interface FileWithAccess {
  file: QuizFile
  access: {
    hasAccess: boolean
    accessType?: FileAccessType | 'SUBSCRIPTION'
  }
}

export class GetFileWithAccessUseCase {
  constructor(
    private readonly fileRepo: IFileRepository,
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly accessRepo: IAccessRepository,
    private readonly accessControl: AccessControlService,
  ) {}

  async execute(fileId: string, userId?: string | null): Promise<FileWithAccess> {
    const file = await this.fileRepo.findById(fileId)
    if (!file) throw new NotFoundException('File')

    if (!userId) {
      return { file, access: { hasAccess: false } }
    }

    const [subscription, fileAccess] = await Promise.all([
      this.subscriptionRepo.findByUserId(userId),
      this.accessRepo.findByUserAndFile(userId, fileId),
    ])

    const hasAccess = this.accessControl.canDecryptFile(subscription, fileAccess)

    let accessType: FileWithAccess['access']['accessType']
    if (hasAccess) {
      const isSubscriptionAccess =
        subscription?.status === 'ACTIVE' ||
        (subscription?.status === 'TRIALING' &&
          subscription.trialEndsAt != null &&
          subscription.trialEndsAt > new Date())
      accessType = isSubscriptionAccess ? 'SUBSCRIPTION' : (fileAccess?.accessType ?? undefined)
    }

    return { file, access: { hasAccess, accessType } }
  }
}
