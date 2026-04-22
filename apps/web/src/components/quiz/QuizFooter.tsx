'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuizStore } from '@/lib/store/quizStore'

interface Props {
  onEndBlock: () => void
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function QuizFooter({ onEndBlock }: Props) {
  const mode = useQuizStore(s => s.mode)
  const timeRemaining = useQuizStore(s => s.timeRemaining)
  const isPaused = useQuizStore(s => s.isPaused)
  const isLocked = useQuizStore(s => s.isLocked)
  const isReverseColor = useQuizStore(s => s.isReverseColor)
  const questions = useQuizStore(s => s.questions)
  const answers = useQuizStore(s => s.answers)
  const tick = useQuizStore(s => s.tick)
  const togglePause = useQuizStore(s => s.togglePause)
  const toggleLock = useQuizStore(s => s.toggleLock)

  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (mode !== 'timed') return
    intervalRef.current = setInterval(tick, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [mode, tick])

  const unanswered = questions.filter(q => answers[q.id] == null).length
  const isLowTime = mode === 'timed' && timeRemaining < 300

  const bg = isReverseColor ? '#111' : '#d1d5db'
  const textColor = isReverseColor ? '#e5e7eb' : '#1f2937'

  return (
    <>
      <footer
        style={{
          background: bg,
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          height: 52,
          padding: '0 20px',
          flexShrink: 0,
          userSelect: 'none',
          borderTop: '1px solid rgba(0,0,0,0.12)',
        }}
      >
        {/* Left: timer + pause */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13 }}>
            Block Time Remaining:{' '}
            <strong style={{ color: isLowTime ? '#dc2626' : textColor, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(mode === 'timed' ? timeRemaining : 0)}
            </strong>
          </span>
          {mode === 'timed' && (
            <button
              onClick={togglePause}
              style={{
                background: 'rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.2)',
                borderRadius: 4,
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: textColor,
              }}
            >
              {isPaused ? '▶' : '⏸'} {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>

        {/* Center: lock */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={toggleLock}
            style={{
              background: 'rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.2)',
              borderRadius: 4,
              padding: '4px 14px',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: textColor,
            }}
          >
            {isLocked ? '🔒' : '🔓'} Lock
          </button>
        </div>

        {/* Right: unanswered + end block */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          {unanswered > 0 && (
            <span style={{ fontSize: 12, opacity: 0.7 }}>{unanswered} unanswered</span>
          )}
          <button
            onClick={() => setShowEndConfirm(true)}
            style={{
              background: '#dc2626',
              border: 'none',
              borderRadius: 4,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
            }}
          >
            🔴 End Block
          </button>
        </div>
      </footer>

      {/* Confirm modal */}
      {showEndConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
        >
          <div style={{
            background: '#fff', borderRadius: 8, padding: 32, maxWidth: 360, width: '90%',
            textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>End Block?</h3>
            {unanswered > 0 && (
              <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 20px' }}>
                You have <strong>{unanswered}</strong> unanswered {unanswered === 1 ? 'question' : 'questions'}.
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: '8px 20px', borderRadius: 6, border: '1px solid #d1d5db',
                  background: '#fff', cursor: 'pointer', fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowEndConfirm(false); onEndBlock() }}
                style={{
                  padding: '8px 20px', borderRadius: 6, border: 'none',
                  background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >
                End Block
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
