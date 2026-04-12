import type { IFileRepository } from '../../ports/outbound/repositories/IFileRepository'
import type { QuizFile } from '../../domain/entities/QuizFile'

export class GetMyFilesUseCase {
  constructor(private readonly fileRepo: IFileRepository) {}

  async execute(userId: string): Promise<QuizFile[]> {
    return this.fileRepo.findByCreatorId(userId)
  }
}
