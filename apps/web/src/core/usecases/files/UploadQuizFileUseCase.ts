import { randomUUID } from 'crypto'
import { parseOptmyBuffer } from '@opentomy/crypto'
import type { IFileRepository } from '../../ports/outbound/repositories/IFileRepository'
import type { IFileStoragePort } from '../../ports/outbound/IFileStoragePort'
import { FileTooLargeException, InvalidFileException } from '../../domain/exceptions/DomainException'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export interface UploadQuizFileInput {
  buffer: Buffer
  fileSize: number
  creatorId: string
}

export interface UploadQuizFileOutput {
  fileId: string
}

export class UploadQuizFileUseCase {
  constructor(
    private readonly fileRepo: IFileRepository,
    private readonly fileStorage: IFileStoragePort,
  ) {}

  async execute(input: UploadQuizFileInput): Promise<UploadQuizFileOutput> {
    if (input.fileSize > MAX_FILE_SIZE) {
      throw new FileTooLargeException()
    }

    let header
    try {
      const parsed = parseOptmyBuffer(input.buffer.buffer)
      header = parsed.header
    } catch {
      throw new InvalidFileException()
    }

    const fileId = randomUUID()
    const fileKey = `quizzes/${fileId}.optmy`

    await this.fileStorage.upload(fileKey, input.buffer)

    await this.fileRepo.create({
      id: fileId,
      creatorId: input.creatorId,
      title: header.title,
      description: header.description,
      questionCount: header.question_count,
      tags: header.tags,
      thumbnailUrl: header.thumbnail_url,
      fileKey,
      fileSize: input.fileSize,
      contentVersion: header.content_version,
      isPublic: true,
    })

    return { fileId }
  }
}
