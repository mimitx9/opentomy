import type { QuizAttemptAnswer } from '../entities/QuizAttempt'

export interface ScoreResult {
  score: number
  maxScore: number
  percent: number
  passed: boolean
}

export class QuizScoringService {
  calculate(answers: QuizAttemptAnswer[], passThreshold = 60): ScoreResult {
    const maxScore = answers.length
    const score = answers.filter(a => a.is_correct).length
    const percent = maxScore > 0 ? (score / maxScore) * 100 : 0
    const passed = percent >= passThreshold

    return { score, maxScore, percent, passed }
  }
}
