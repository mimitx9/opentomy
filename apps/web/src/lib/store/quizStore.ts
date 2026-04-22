'use client'

import { create } from 'zustand'
import type { QuizQuestion, QuizMode } from '@/types/quizSession'

interface QuizStore {
  // Session data
  questions: QuizQuestion[]
  currentIndex: number
  mode: QuizMode
  timeRemaining: number
  isPaused: boolean
  isLocked: boolean
  isEnded: boolean
  textZoom: number
  isReverseColor: boolean

  // Answers: question_id → answer_id
  answers: Record<number, number | null>
  markedIds: number[]
  // question_id → answer_ids crossed out
  crossedOut: Record<number, number[]>
  // question_id → whether explanation is showing
  shownExplanations: Record<number, boolean>

  // Actions
  loadQuestions: (questions: QuizQuestion[], mode: QuizMode, timeLimitSeconds?: number) => void
  selectAnswer: (questionId: number, answerId: number) => void
  toggleMark: (questionId: number) => void
  toggleCrossOut: (questionId: number, answerId: number) => void
  showExplanation: (questionId: number) => void
  goTo: (index: number) => void
  next: () => void
  prev: () => void
  tick: () => void
  togglePause: () => void
  toggleLock: () => void
  toggleReverseColor: () => void
  setTextZoom: (zoom: number) => void
  endBlock: () => void
  reset: () => void
}

const DEFAULT_TIME = 60 * 60 // 60 min default

export const useQuizStore = create<QuizStore>((set, get) => ({
  questions: [],
  currentIndex: 0,
  mode: 'tutor',
  timeRemaining: DEFAULT_TIME,
  isPaused: false,
  isLocked: false,
  isEnded: false,
  textZoom: 100,
  isReverseColor: false,
  answers: {},
  markedIds: [],
  crossedOut: {},
  shownExplanations: {},

  loadQuestions: (questions, mode, timeLimitSeconds) => {
    set({
      questions,
      currentIndex: 0,
      mode,
      timeRemaining: timeLimitSeconds ?? DEFAULT_TIME,
      isPaused: false,
      isLocked: false,
      isEnded: false,
      answers: {},
      markedIds: [],
      crossedOut: {},
      shownExplanations: {},
    })
  },

  selectAnswer: (questionId, answerId) => {
    const { mode, answers } = get()
    // Don't allow changing answer after selection
    if (answers[questionId] !== undefined && answers[questionId] !== null) return

    set(state => ({
      answers: { ...state.answers, [questionId]: answerId },
      // In tutor mode, show explanation immediately
      shownExplanations: mode === 'tutor'
        ? { ...state.shownExplanations, [questionId]: true }
        : state.shownExplanations,
    }))
  },

  toggleMark: (questionId) => {
    set(state => ({
      markedIds: state.markedIds.includes(questionId)
        ? state.markedIds.filter(id => id !== questionId)
        : [...state.markedIds, questionId],
    }))
  },

  toggleCrossOut: (questionId, answerId) => {
    set(state => {
      const existing = state.crossedOut[questionId] ?? []
      const next = existing.includes(answerId)
        ? existing.filter(id => id !== answerId)
        : [...existing, answerId]
      return { crossedOut: { ...state.crossedOut, [questionId]: next } }
    })
  },

  showExplanation: (questionId) => {
    set(state => ({
      shownExplanations: { ...state.shownExplanations, [questionId]: true },
    }))
  },

  goTo: (index) => {
    const { questions } = get()
    if (index >= 0 && index < questions.length) {
      set({ currentIndex: index })
    }
  },

  next: () => {
    const { currentIndex, questions } = get()
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  prev: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  tick: () => {
    const { timeRemaining, isPaused, isEnded } = get()
    if (isPaused || isEnded) return
    if (timeRemaining <= 0) {
      set({ isEnded: true })
      return
    }
    set({ timeRemaining: timeRemaining - 1 })
  },

  togglePause: () => set(state => ({ isPaused: !state.isPaused })),
  toggleLock: () => set(state => ({ isLocked: !state.isLocked })),
  toggleReverseColor: () => set(state => ({ isReverseColor: !state.isReverseColor })),
  setTextZoom: (zoom) => set({ textZoom: zoom }),

  endBlock: () => {
    const { questions } = get()
    // Show all explanations on end
    const all: Record<number, boolean> = {}
    questions.forEach(q => { all[q.id] = true })
    set({ isEnded: true, shownExplanations: all })
  },

  reset: () => set({
    questions: [],
    currentIndex: 0,
    mode: 'tutor',
    timeRemaining: DEFAULT_TIME,
    isPaused: false,
    isLocked: false,
    isEnded: false,
    answers: {},
    markedIds: [],
    crossedOut: {},
    shownExplanations: {},
  }),
}))

// Selectors
export const useCurrentQuestion = () =>
  useQuizStore(s => s.questions[s.currentIndex])

export const useCurrentAnswer = () =>
  useQuizStore(s => {
    const q = s.questions[s.currentIndex]
    return q ? s.answers[q.id] ?? null : null
  })

export const useIsMarked = (questionId: number) =>
  useQuizStore(s => s.markedIds.includes(questionId))

export const useCrossedOut = (questionId: number) =>
  useQuizStore(s => s.crossedOut[questionId] ?? [])

export const useShowExplanation = (questionId: number) =>
  useQuizStore(s => s.shownExplanations[questionId] ?? false)
