import type { IFileRepository } from '../../ports/outbound/repositories/IFileRepository'
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
    private readonly accessControl: AccessControlService,
  ) {}

  async execute(input: DeleteFileInput): Promise<void> {
    const file = await this.fileRepo.findById(input.fileId)
    if (!file) throw new NotFoundException('File')

    if (!this.accessControl.canDeleteFile(input.userId, file.creatorId, input.userRole)) {
      throw new ForbiddenException()
    }

    // Cascade delete handles Subject → Exam → QuizSet → Question → Answer/QuestionProfile
    await this.fileRepo.delete(input.fileId)
  }
}
