import React from 'react'
import type { QuizAttemptResult } from '@opentomy/types'

export interface QuizResultProps {
  result: QuizAttemptResult
  onRetry?: () => void
  onExit?: () => void
}

export function QuizResult({ result, onRetry, onExit }: QuizResultProps) {
  const passed = result.passed
  const color = passed ? '#16a34a' : '#dc2626'
  const correctCount = result.answers.filter((a) => a.is_correct).length

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>{passed ? '🎉' : '📝'}</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 4 }}>
        {Math.round(result.percent)}%
      </h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        {correctCount} of {result.answers.length} correct
        {result.passed !== null && (
          <span style={{ marginLeft: 8, fontWeight: 600, color }}>
            ({passed ? 'Passed' : 'Failed'})
          </span>
        )}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{ padding: '10px 24px', border: '1px solid #2563eb', borderRadius: 8, color: '#2563eb', background: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Try Again
          </button>
        )}
        {onExit && (
          <button
            onClick={onExit}
            style={{ padding: '10px 24px', background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Done
          </button>
        )}
      </div>
    </div>
  )
}
