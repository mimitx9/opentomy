export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'fill_blank'

export interface QuizQuestion {
  id: string
  type: QuestionType
  stem: string
  options: string[]          // empty for short_answer
  correct_index: number      // -1 for short_answer
  correct_text?: string      // for short_answer / fill_blank
  explanation?: string
  image_url?: string | null
  points: number
  order: number
}

export interface QuizSettings {
  shuffle_questions: boolean
  shuffle_options: boolean
  show_explanations: boolean
  time_limit_seconds: number | null
  max_attempts: number | null
  pass_score_percent: number | null
}

export interface QuizPayload {
  id: string
  title: string
  description?: string
  questions: QuizQuestion[]
  settings: QuizSettings
}

export interface QuizAttemptAnswer {
  question_id: string
  selected_index: number | null
  selected_text?: string
  is_correct: boolean
  time_spent_ms?: number
}

export interface QuizAttemptResult {
  attempt_id: string
  quiz_id: string
  score: number
  max_score: number
  percent: number
  passed: boolean
  answers: QuizAttemptAnswer[]
  started_at: string
  completed_at: string
}
