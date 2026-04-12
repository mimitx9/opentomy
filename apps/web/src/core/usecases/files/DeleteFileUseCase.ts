import type { IFileRepository } from '../../ports/outbound/repositories/IFileRepository'
import type { IFileStoragePort } from '../../ports/outbound/IFileStoragePort'
import type { AccessControlService } from '../../domain/services/AccessControlService'
import { NotFoundException, ForbiddenException } from '../../domain/exceptions/DomainException'

export interface DeleteFileInput {
  fileId: string
  userId: string
  userRole: string
}

export class DeleteFileUseCase {
  constructor(
    private readonly fileRepo: IFileRepository,
    private readonly fileStorage: IFileStoragePort,
    private readonly accessControl: AccessControlService,
  ) {}

  async execute(input: DeleteFileInput): Promise<void> {
    const file = await this.fileRepo.findById(input.fileId)
    if (!file) throw new NotFoundException('File')

    if (!this.accessControl.canDeleteFile(input.userId, file.creatorId, input.userRole)) {
      throw new ForbiddenException()
    }

    await this.fileStorage.delete(file.fileKey)
    await this.fileRepo.delete(input.fileId)
  }
}
