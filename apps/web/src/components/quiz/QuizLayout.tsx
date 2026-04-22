'use client'

import { ReactNode } from 'react'
import QuestionNavigator from './QuestionNavigator'
import QuizHeader from './QuizHeader'
import QuizFooter from './QuizFooter'
import { useQuizStore } from '@/lib/store/quizStore'

interface Props {
  children: ReactNode
  onEndBlock: () => void
}

export default function QuizLayout({ children, onEndBlock }: Props) {
  const isPaused = useQuizStore(s => s.isPaused)
  const mode = useQuizStore(s => s.mode)
  const isReverseColor = useQuizStore(s => s.isReverseColor)
  const togglePause = useQuizStore(s => s.togglePause)

  const mainBg = isReverseColor ? '#0f172a' : '#f3f4f6'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: mainBg }}>
      {/* Header spans full width */}
      <QuizHeader onEndBlock={onEndBlock} />

      {/* Body: navigator + scrollable content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar navigator */}
        <QuestionNavigator />

        {/* Main question area */}
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {children}

          {/* Pause overlay */}
          {isPaused && mode === 'timed' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.75)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
              }}
            >
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⏸</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Quiz Paused</h2>
                <p style={{ color: '#9ca3af', marginBottom: 24 }}>Your timer has been paused.</p>
                <button
                  onClick={togglePause}
                  style={{
                    padding: '10px 28px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Resume
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer spans full width */}
      <QuizFooter onEndBlock={onEndBlock} />
    </div>
  )
}
