import type { FileAccess } from '../../../domain/entities/FileAccess'

export interface IAccessRepository {
  findByUserAndFile(userId: string, fileId: string): Promise<FileAccess | null>
}
