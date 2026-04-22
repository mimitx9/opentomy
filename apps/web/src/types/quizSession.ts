// SQLite schema row types (matching builder.ts schema)
export interface DbSubject {
  id: number
  code: string
  name: string
  sort_order: number
}

export interface DbExam {
  id: number
  subject_id: number
  code: string
  name: string
  sort_order: number
}

export interface DbQuizSet {
  id: number
  exam_id: number
  code: string
  name: string
  total_questions: number
  sort_order: number
}

export interface DbQuestion {
  id: number
  quiz_set_id: number
  type: string
  stem: string
  image_url: string | null
  difficulty: number
  sort_order: number
}

export interface DbAnswer {
  id: number
  question_id: number
  text: string
  is_correct: number
  explanation: string | null
  image_url: string | null
  sort_order: number
}

export interface DbQuestionProfile {
  id: number
  question_id: number
  attribute_type: string
  value: string
}

// Runtime quiz types
export interface QuizAnswer {
  id: number
  text: string
  is_correct: boolean
  explanation?: string
  image_url?: string
}

export interface QuizQuestion {
  id: number
  stem: string
  image_url?: string
  answers: QuizAnswer[]
  subject?: string
  system?: string
}

export type QuizMode = 'tutor' | 'timed'

export interface QuizSessionState {
  questions: QuizQuestion[]
  currentIndex: number
  /** question_id → selected answer_id (null = unanswered) */
  answers: Record<number, number | null>
  markedIds: number[]
  /** question_id → array of crossed-out answer_ids */
  crossedOut: Record<number, number[]>
  showExplanationForQuestion: Record<number, boolean>
  mode: QuizMode
  timeRemaining: number
  isPaused: boolean
  isLocked: boolean
  textZoom: number
  isReverseColor: boolean
  isEnded: boolean
}

export interface CreateTestOptions {
  subjectIds: number[]
  systems: string[]
  limit: number
  mode: QuizMode
  timeLimitSeconds: number | null
}

export interface SubjectStat {
  subject: DbSubject
  questionCount: number
}

export interface SystemStat {
  name: string
  questionCount: number
}
