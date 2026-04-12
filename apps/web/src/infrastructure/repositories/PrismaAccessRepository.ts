import { prisma } from '@opentomy/db'
import type { IAccessRepository } from '../../core/ports/outbound/repositories/IAccessRepository'
import type { FileAccess } from '../../core/domain/entities/FileAccess'

export class PrismaAccessRepository implements IAccessRepository {
  async findByUserAndFile(userId: string, fileId: string): Promise<FileAccess | null> {
    return prisma.fileAccess.findUnique({
      where: { userId_fileId: { userId, fileId } },
    }) as Promise<FileAccess | null>
  }
}
