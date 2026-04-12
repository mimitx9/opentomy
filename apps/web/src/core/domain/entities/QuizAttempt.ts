export interface QuizAttemptAnswer {
  question_id: string
  selected_index: number | null
  selected_text?: string
  is_correct: boolean
  time_spent_ms?: number
}

export interface QuizAttempt {
  id: string
  userId: string
  fileId: string
  score?: number | null
  maxScore?: number | null
  percent?: number | null
  passed?: boolean | null
  answers: QuizAttemptAnswer[]
  startedAt: Date
  completedAt?: Date | null
}
