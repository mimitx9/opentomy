'use client'

import { useEffect, useRef } from 'react'
import { useQuizStore } from '@/lib/store/quizStore'

const LABEL_COLORS = ['A', 'B', 'C', 'D', 'E']

export default function QuestionNavigator() {
  const questions = useQuizStore(s => s.questions)
  const currentIndex = useQuizStore(s => s.currentIndex)
  const answers = useQuizStore(s => s.answers)
  const markedIds = useQuizStore(s => s.markedIds)
  const shownExplanations = useQuizStore(s => s.shownExplanations)
  const goTo = useQuizStore(s => s.goTo)
  const isReverseColor = useQuizStore(s => s.isReverseColor)

  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [currentIndex])

  const bg = isReverseColor ? '#1a1a2e' : '#1e3a5f'
  const activeBg = isReverseColor ? '#2a2a4e' : '#2a4f82'

  return (
    <div
      ref={containerRef}
      style={{
        width: 72,
        minWidth: 72,
        background: bg,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 8,
        gap: 2,
      }}
    >
      {questions.map((q, idx) => {
        const isCurrent = idx === currentIndex
        const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null
        const isMarked = markedIds.includes(q.id)
        const showExp = shownExplanations[q.id]

        // Determine correctness for answered + explanation shown
        let isCorrect = false
        if (isAnswered && showExp) {
          const selectedAnswerId = answers[q.id]
          const correctAnswer = q.answers.find(a => a.is_correct)
          isCorrect = correctAnswer?.id === selectedAnswerId
        }

        let dotColor = '#6b7280' // unanswered = gray
        if (isAnswered && showExp) {
          dotColor = isCorrect ? '#16a34a' : '#dc2626'
        } else if (isAnswered) {
          dotColor = '#3b82f6' // answered, not reviewed
        }

        return (
          <button
            key={q.id}
            ref={isCurrent ? activeRef : undefined}
            onClick={() => goTo(idx)}
            aria-current={isCurrent ? 'true' : undefined}
            aria-label={`Question ${idx + 1}`}
            style={{
              width: 44,
              height: 44,
              borderRadius: 4,
              border: isCurrent ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.1)',
              background: isCurrent ? activeBg : 'transparent',
              color: '#fff',
              fontSize: 13,
              fontWeight: isCurrent ? 700 : 400,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              position: 'relative',
              transition: 'background 0.15s',
            }}
          >
            {isMarked && (
              <span style={{ position: 'absolute', top: 2, right: 4, color: '#fbbf24', fontSize: 8 }}>▶</span>
            )}
            <span>{idx + 1}</span>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: dotColor,
                display: 'block',
              }}
            />
          </button>
        )
      })}
      {/* Legend */}
      <div style={{ marginTop: 12, padding: '0 4px', width: '100%' }}>
        {[
          { color: '#6b7280', label: 'Unans.' },
          { color: '#3b82f6', label: 'Ans.' },
          { color: '#16a34a', label: 'Correct' },
          { color: '#dc2626', label: 'Wrong' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ color: '#9ca3af', fontSize: 9, lineHeight: 1 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { LABEL_COLORS }
