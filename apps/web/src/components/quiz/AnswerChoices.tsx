'use client'

import { useCallback } from 'react'
import { useQuizStore } from '@/lib/store/quizStore'

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function AnswerChoices() {
  const questions = useQuizStore(s => s.questions)
  const currentIndex = useQuizStore(s => s.currentIndex)
  const answers = useQuizStore(s => s.answers)
  const crossedOut = useQuizStore(s => s.crossedOut)
  const shownExplanations = useQuizStore(s => s.shownExplanations)
  const isReverseColor = useQuizStore(s => s.isReverseColor)
  const isLocked = useQuizStore(s => s.isLocked)
  const textZoom = useQuizStore(s => s.textZoom)
  const selectAnswer = useQuizStore(s => s.selectAnswer)
  const toggleCrossOut = useQuizStore(s => s.toggleCrossOut)
  const next = useQuizStore(s => s.next)

  const question = questions[currentIndex]
  const selectedAnswerId = question ? answers[question.id] ?? null : null
  const crossedOutIds = question ? (crossedOut[question.id] ?? []) : []
  const showExp = question ? !!shownExplanations[question.id] : false
  const hasAnswer = selectedAnswerId != null

  const bg = isReverseColor ? '#111827' : '#fff'
  const textColor = isReverseColor ? '#e5e7eb' : '#111827'
  const borderColor = isReverseColor ? '#374151' : '#d1d5db'
  const hoverBg = isReverseColor ? '#1f2937' : '#f9fafb'

  const handleSelect = useCallback((answerId: number) => {
    if (!question || isLocked) return
    selectAnswer(question.id, answerId)
  }, [question, isLocked, selectAnswer])

  const handleCrossOut = useCallback((e: React.MouseEvent, answerId: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (!question || hasAnswer) return
    toggleCrossOut(question.id, answerId)
  }, [question, hasAnswer, toggleCrossOut])

  if (!question) return null

  const correctAnswer = question.answers.find(a => a.is_correct)

  // Find explanation text: prefer the selected/correct answer's explanation
  const explanationText = showExp
    ? (correctAnswer?.explanation ?? question.answers.find(a => a.explanation)?.explanation ?? null)
    : null

  return (
    <div style={{ padding: '0 32px 32px', background: bg, fontSize: `${textZoom}%` }}>
      {/* Answer choices box */}
      <div style={{ border: `1px solid ${borderColor}`, borderRadius: 8, overflow: 'hidden' }}>
        {question.answers.map((answer, idx) => {
          const label = LABELS[idx] ?? String(idx + 1)
          const isSelected = selectedAnswerId === answer.id
          const isCrossed = crossedOutIds.includes(answer.id)
          const isCorrect = showExp && answer.is_correct
          const isWrong = showExp && isSelected && !answer.is_correct

          let rowBg = 'transparent'
          let rowColor = textColor
          if (isCorrect) { rowBg = isReverseColor ? '#14532d' : '#dcfce7'; rowColor = isReverseColor ? '#86efac' : '#15803d' }
          if (isWrong) { rowBg = isReverseColor ? '#7f1d1d' : '#fee2e2'; rowColor = isReverseColor ? '#fca5a5' : '#dc2626' }

          return (
            <div
              key={answer.id}
              onClick={() => !showExp && handleSelect(answer.id)}
              onContextMenu={(e) => handleCrossOut(e, answer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                cursor: showExp ? 'default' : 'pointer',
                background: rowBg || (isSelected && !showExp ? (isReverseColor ? '#1e3a5f' : '#eff6ff') : 'transparent'),
                borderTop: idx > 0 ? `1px solid ${borderColor}` : 'none',
                opacity: isCrossed && !showExp ? 0.35 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (!showExp && !isSelected) (e.currentTarget as HTMLElement).style.background = hoverBg
              }}
              onMouseLeave={e => {
                if (!showExp && !isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {/* Radio indicator */}
              <div style={{ flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isCorrect ? (
                  <span style={{ fontSize: 18, color: '#16a34a' }}>✓</span>
                ) : isWrong ? (
                  <span style={{ fontSize: 18, color: '#dc2626' }}>✗</span>
                ) : isSelected ? (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
                  </div>
                ) : (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isReverseColor ? '#6b7280' : '#9ca3af'}` }} />
                )}
              </div>

              {/* Label + text */}
              <span
                style={{
                  flex: 1,
                  fontSize: '0.95em',
                  lineHeight: 1.5,
                  color: rowColor || (isSelected && !showExp ? '#2563eb' : textColor),
                  textDecoration: isCrossed ? 'line-through' : 'none',
                }}
              >
                <strong style={{ marginRight: 6 }}>{label}.</strong>
                {answer.text}
              </span>

              {/* Cross-out button */}
              {!showExp && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCrossOut(e, answer.id) }}
                  title="Cross out"
                  style={{
                    flexShrink: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: isCrossed ? '#dc2626' : (isReverseColor ? '#4b5563' : '#d1d5db'),
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Explanation */}
      {showExp && explanationText && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: isReverseColor ? '#1a2332' : '#f0f9ff',
            border: `1px solid ${isReverseColor ? '#1e3a5f' : '#bae6fd'}`,
            borderRadius: 8,
            fontSize: '0.9em',
            lineHeight: 1.6,
            color: isReverseColor ? '#93c5fd' : '#0369a1',
          }}
        >
          <strong style={{ display: 'block', marginBottom: 8, fontSize: '1em', color: isReverseColor ? '#60a5fa' : '#0284c7' }}>
            Explanation
          </strong>
          <div style={{ color: isReverseColor ? '#cbd5e1' : '#374151', whiteSpace: 'pre-wrap' }}>
            {explanationText}
          </div>
        </div>
      )}

      {/* Proceed button */}
      {showExp && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={next}
            style={{
              padding: '8px 20px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Proceed to Next Item ►
          </button>
        </div>
      )}
    </div>
  )
}
