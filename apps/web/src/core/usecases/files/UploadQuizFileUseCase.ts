import { parseOptmyBuffer } from '@opentomy/crypto'
import type { PrismaClient } from '@opentomy/db'
import type { IFileRepository } from '../../ports/outbound/repositories/IFileRepository'
import { FileTooLargeException, InvalidFileException, ConflictException } from '../../domain/exceptions/DomainException'
import { decryptOptmyToSqlite } from '@/lib/optmy/serverDecrypt'
import { importSqliteToMysql } from '@/lib/sqlite/serverSqliteReader'

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
    private readonly prisma: PrismaClient,
  ) {}

  async execute(input: UploadQuizFileInput): Promise<UploadQuizFileOutput> {
    if (input.fileSize > MAX_FILE_SIZE) {
      throw new FileTooLargeException()
    }

    let header
    try {
      const parsed = parseOptmyBuffer(input.buffer.buffer as ArrayBuffer)
      header = parsed.header
    } catch {
      throw new InvalidFileException()
    }

    if (header.content_type !== 'sqlite') {
      throw new InvalidFileException()
    }

    const fileId = header.file_id
    const existing = await this.fileRepo.findById(fileId)
    if (existing) {
      throw new ConflictException('A file with this ID already exists')
    }

    const { sqliteBuffer } = await decryptOptmyToSqlite(input.buffer)
    const { questionCount } = await importSqliteToMysql(sqliteBuffer, fileId, this.prisma)

    await this.fileRepo.create({
      id: fileId,
      creatorId: input.creatorId,
      title: header.title,
      description: header.description,
      questionCount,
      tags: header.tags,
      thumbnailUrl: header.thumbnail_url,
      fileSize: input.fileSize,
      isPublic: false,
    })

    return { fileId }
  }
}
