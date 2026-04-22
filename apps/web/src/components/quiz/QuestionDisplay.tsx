'use client'

import { useMemo } from 'react'
import { useQuizStore } from '@/lib/store/quizStore'

export default function QuestionDisplay() {
  const questions = useQuizStore(s => s.questions)
  const currentIndex = useQuizStore(s => s.currentIndex)
  const textZoom = useQuizStore(s => s.textZoom)
  const isReverseColor = useQuizStore(s => s.isReverseColor)

  const question = questions[currentIndex]

  const lines = useMemo(() => {
    if (!question?.stem) return []
    return question.stem.split('\n')
  }, [question?.stem])

  const bg = isReverseColor ? '#111827' : '#fff'
  const textColor = isReverseColor ? '#e5e7eb' : '#111827'
  const lineNumColor = isReverseColor ? '#6b7280' : '#9ca3af'
  const borderColor = isReverseColor ? '#374151' : '#e5e7eb'

  if (!question) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
        Loading question...
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '32px',
        background: bg,
        color: textColor,
        fontSize: `${textZoom}%`,
        minHeight: '100%',
      }}
    >
      <div style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Left: question text with line numbers */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              {/* Line numbers */}
              <div
                style={{
                  flexShrink: 0,
                  textAlign: 'right',
                  paddingRight: 16,
                  borderRight: `1px solid ${borderColor}`,
                }}
              >
                {lines.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.85em',
                      color: lineNumColor,
                      lineHeight: 1.6,
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Question text */}
              <div style={{ flex: 1, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {question.stem}
              </div>
            </div>
          </div>

          {/* Right: optional image */}
          {question.image_url && (
            <div style={{ flexShrink: 0, width: 280 }}>
              <div style={{ position: 'sticky', top: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.image_url}
                  alt="Clinical image"
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    objectFit: 'contain',
                    maxHeight: 320,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
