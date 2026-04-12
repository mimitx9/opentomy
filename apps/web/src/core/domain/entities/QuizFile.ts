export interface QuizFile {
  id: string
  creatorId: string
  title: string
  description?: string | null
  questionCount: number
  tags: string[]
  thumbnailUrl?: string | null
  fileKey: string
  fileSize: number
  contentVersion: number
  isPublic: boolean
  downloadCount: number
  createdAt: Date
  updatedAt: Date
}
