import { prisma } from '@opentomy/db'
import type {
  IQuizAttemptRepository,
  CreateAttemptInput,
} from '../../core/ports/outbound/repositories/IQuizAttemptRepository'
import type { QuizAttempt } from '../../core/domain/entities/QuizAttempt'

export class PrismaQuizAttemptRepository implements IQuizAttemptRepository {
  async create(input: CreateAttemptInput): Promise<QuizAttempt> {
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: input.userId,
        fileId: input.fileId,
        score: input.score,
        maxScore: input.maxScore,
        percent: input.percent,
        passed: input.passed,
        answers: input.answers as object[],
        completedAt: input.completedAt,
      },
    })
    return {
      ...attempt,
      answers: attempt.answers as unknown as QuizAttempt['answers'],
    }
  }
}
