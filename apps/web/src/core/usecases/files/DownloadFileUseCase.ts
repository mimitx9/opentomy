import type { IFileRepository } from '../../ports/outbound/repositories/IFileRepository'
import type { IDecryptTokenRepository } from '../../ports/outbound/repositories/IDecryptTokenRepository'
import type { IFileStoragePort } from '../../ports/outbound/IFileStoragePort'
import { NotFoundException, ForbiddenException } from '../../domain/exceptions/DomainException'

export interface DownloadFileOutput {
  buffer: Buffer
  fileName: string
}

export class DownloadFileUseCase {
  constructor(
    private readonly fileRepo: IFileRepository,
    private readonly decryptTokenRepo: IDecryptTokenRepository,
    private readonly fileStorage: IFileStoragePort,
  ) {}

  async execute(fileId: string, userId: string): Promise<DownloadFileOutput> {
    const file = await this.fileRepo.findById(fileId)
    if (!file) throw new NotFoundException('File')

    const token = await this.decryptTokenRepo.findValidToken(userId, fileId)
    if (!token) throw new ForbiddenException('No valid decrypt token')

    const buffer = await this.fileStorage.getBuffer(file.fileKey)
    return { buffer, fileName: `${file.id}.optmy` }
  }
}
