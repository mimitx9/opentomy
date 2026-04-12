import type { IQuizAttemptRepository } from '../../ports/outbound/repositories/IQuizAttemptRepository'
import type { QuizScoringService } from '../../domain/services/QuizScoringService'
import type { QuizAttemptAnswer } from '../../domain/entities/QuizAttempt'

export interface SubmitQuizAttemptInput {
  fileId: string
  userId: string
  answers: QuizAttemptAnswer[]
}

export interface SubmitQuizAttemptOutput {
  attemptId: string
  score: number
  maxScore: number
  percent: number
  passed: boolean
  answers: QuizAttemptAnswer[]
  startedAt: string
  completedAt: string
}

export class SubmitQuizAttemptUseCase {
  constructor(
    private readonly attemptRepo: IQuizAttemptRepository,
    private readonly quizScoring: QuizScoringService,
  ) {}

  async execute(input: SubmitQuizAttemptInput): Promise<SubmitQuizAttemptOutput> {
    const { score, maxScore, percent, passed } = this.quizScoring.calculate(input.answers)
    const completedAt = new Date()

    const attempt = await this.attemptRepo.create({
      userId: input.userId,
      fileId: input.fileId,
      score,
      maxScore,
      percent,
      passed,
      answers: input.answers,
      completedAt,
    })

    return {
      attemptId: attempt.id,
      score,
      maxScore,
      percent,
      passed,
      answers: input.answers,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
    }
  }
}
