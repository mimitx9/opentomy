import type { QuizFile } from '../../../domain/entities/QuizFile'

export interface CreateFileInput {
  id: string
  creatorId: string
  title: string
  description?: string | null
  questionCount: number
  tags: string[]
  thumbnailUrl?: string | null
  fileSize?: number
  isPublic: boolean
}

export interface ListFilesInput {
  isPublic?: boolean
  search?: string
  page: number
  limit: number
}

export interface ListFilesResult {
  files: QuizFile[]
  total: number
}

export interface IFileRepository {
  findById(id: string): Promise<QuizFile | null>
  findMany(input: ListFilesInput): Promise<ListFilesResult>
  findByCreatorId(creatorId: string): Promise<QuizFile[]>
  create(input: CreateFileInput): Promise<QuizFile>
  delete(id: string): Promise<void>
}
