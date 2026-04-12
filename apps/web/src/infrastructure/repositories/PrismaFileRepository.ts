import { prisma } from '@opentomy/db'
import type {
  IFileRepository,
  CreateFileInput,
  ListFilesInput,
  ListFilesResult,
} from '../../core/ports/outbound/repositories/IFileRepository'
import type { QuizFile } from '../../core/domain/entities/QuizFile'

/**
 * Map Prisma record → domain QuizFile
 * MySQL stores tags as Json (array) — we cast to string[]
 */
function toQuizFile(record: Record<string, unknown>): QuizFile {
  return {
    ...record,
    tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
  } as QuizFile
}

export class PrismaFileRepository implements IFileRepository {
  async findById(id: string): Promise<QuizFile | null> {
    const record = await prisma.quizFile.findUnique({ where: { id } })
    return record ? toQuizFile(record as Record<string, unknown>) : null
  }

  async findMany(input: ListFilesInput): Promise<ListFilesResult> {
    const { isPublic, search, page, limit } = input

    const where = {
      ...(isPublic !== undefined ? { isPublic } : {}),
      // MySQL: String comparison is case-insensitive by default (utf8mb4 collation)
      ...(search ? { title: { contains: search } } : {}),
    }

    const [records, total] = await Promise.all([
      prisma.quizFile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quizFile.count({ where }),
    ])

    return {
      files: records.map(r => toQuizFile(r as Record<string, unknown>)),
      total,
    }
  }

  async findByCreatorId(creatorId: string): Promise<QuizFile[]> {
    const records = await prisma.quizFile.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map(r => toQuizFile(r as Record<string, unknown>))
  }

  async create(input: CreateFileInput): Promise<QuizFile> {
    const record = await prisma.quizFile.create({
      data: {
        ...input,
        // Prisma expects Json — tags: string[] is compatible
        tags: input.tags,
      },
    })
    return toQuizFile(record as Record<string, unknown>)
  }

  async delete(id: string): Promise<void> {
    await prisma.quizFile.delete({ where: { id } })
  }
}
