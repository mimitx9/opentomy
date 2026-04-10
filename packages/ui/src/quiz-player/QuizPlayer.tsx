import React, { useState, useCallback, useEffect } from 'react'
import type { QuizPayload, QuizQuestion, QuizAttemptAnswer } from '@opentomy/types'

export interface QuizPlayerProps {
  quiz: QuizPayload
  onComplete: (answers: QuizAttemptAnswer[]) => void
  onExit?: () => void
}

interface PlayerState {
  currentIndex: number
  answers: Map<string, QuizAttemptAnswer>
  questionOrder: number[]
  optionOrders: Map<string, number[]>
  startedAt: Date
  questionStartedAt: Date
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function QuizPlayer({ quiz, onComplete, onExit }: QuizPlayerProps) {
  const [state, setState] = useState<PlayerState>(() => {
    const questionOrder = quiz.settings.shuffle_questions
      ? shuffleArray(quiz.questions.map((_, i) => i))
      : quiz.questions.map((_, i) => i)

    const optionOrders = new Map<string, number[]>()
    quiz.questions.forEach((q) => {
      optionOrders.set(
        q.id,
        quiz.settings.shuffle_options
          ? shuffleArray(q.options.map((_, i) => i))
          : q.options.map((_, i) => i),
      )
    })

    return {
      currentIndex: 0,
      answers: new Map(),
      questionOrder,
      optionOrders,
      startedAt: new Date(),
      questionStartedAt: new Date(),
    }
  })

  const currentQuestion = quiz.questions[state.questionOrder[state.currentIndex]]
  const optionOrder = state.optionOrders.get(currentQuestion.id) ?? currentQuestion.options.map((_, i) => i)
  const selectedAnswer = state.answers.get(currentQuestion.id)
  const isAnswered = selectedAnswer !== undefined
  const isLast = state.currentIndex === quiz.questions.length - 1
  const showExplanation = quiz.settings.show_explanations && isAnswered

  const handleSelect = useCallback((optionIndex: number) => {
    if (isAnswered) return
    const timeSpentMs = Date.now() - state.questionStartedAt.getTime()
    const isCorrect = optionIndex === currentQuestion.correct_index

    setState((s) => ({
      ...s,
      answers: new Map(s.answers).set(currentQuestion.id, {
        question_id: currentQuestion.id,
        selected_index: optionIndex,
        is_correct: isCorrect,
        time_spent_ms: timeSpentMs,
      }),
    }))
  }, [isAnswered, currentQuestion, state.questionStartedAt])

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete(Array.from(state.answers.values()))
    } else {
      setState((s) => ({
        ...s,
        currentIndex: s.currentIndex + 1,
        questionStartedAt: new Date(),
      }))
    }
  }, [isLast, state.answers, onComplete])

  return (
    <div className="quiz-player" style={{ userSelect: 'none', maxWidth: 720, margin: '0 auto', padding: 24 }}>
      {/* Progress */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: '#666' }}>
          Question {state.currentIndex + 1} / {quiz.questions.length}
        </span>
        {onExit && (
          <button onClick={onExit} style={{ fontSize: 13, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>
            Exit
          </button>
        )}
      </div>
      <div style={{ height: 4, background: '#eee', borderRadius: 2, marginBottom: 24 }}>
        <div
          style={{
            height: '100%',
            width: `${((state.currentIndex + 1) / quiz.questions.length) * 100}%`,
            background: '#2563eb',
            borderRadius: 2,
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Stem */}
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, lineHeight: 1.4 }}>
        {currentQuestion.stem}
      </h2>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {optionOrder.map((optIdx) => {
          const option = currentQuestion.options[optIdx]
          const isSelected = selectedAnswer?.selected_index === optIdx
          const isCorrect = optIdx === currentQuestion.correct_index
          let bg = '#f8fafc'
          let border = '1px solid #e2e8f0'
          if (isAnswered) {
            if (isCorrect) { bg = '#dcfce7'; border = '1px solid #16a34a' }
            else if (isSelected && !isCorrect) { bg = '#fee2e2'; border = '1px solid #dc2626' }
          } else if (isSelected) {
            bg = '#eff6ff'; border = '1px solid #2563eb'
          }

          return (
            <button
              key={optIdx}
              onClick={() => handleSelect(optIdx)}
              disabled={isAnswered}
              style={{
                padding: '14px 18px',
                background: bg,
                border,
                borderRadius: 8,
                textAlign: 'left',
                cursor: isAnswered ? 'default' : 'pointer',
                fontSize: 16,
                transition: 'background 0.15s, border 0.15s',
              }}
            >
              {option}
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {showExplanation && currentQuestion.explanation && (
        <div style={{ padding: '12px 16px', background: '#f0f9ff', borderRadius: 8, marginBottom: 20, fontSize: 14, color: '#0369a1' }}>
          <strong>Explanation:</strong> {currentQuestion.explanation}
        </div>
      )}

      {/* Next / Submit */}
      {isAnswered && (
        <button
          onClick={handleNext}
          style={{
            padding: '12px 32px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            float: 'right',
          }}
        >
          {isLast ? 'Submit' : 'Next'}
        </button>
      )}
    </div>
  )
}
