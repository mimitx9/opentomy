import type { QuizAttempt, QuizAttemptAnswer } from '../../../domain/entities/QuizAttempt'

export interface CreateAttemptInput {
  userId: string
  fileId: string
  score: number
  maxScore: number
  percent: number
  passed: boolean
  answers: QuizAttemptAnswer[]
  completedAt: Date
}

export interface IQuizAttemptRepository {
  create(input: CreateAttemptInput): Promise<QuizAttempt>
}
