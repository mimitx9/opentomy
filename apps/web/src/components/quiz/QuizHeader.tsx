'use client'

import { useQuizStore } from '@/lib/store/quizStore'

interface Props {
  onEndBlock: () => void
}

export default function QuizHeader({ onEndBlock }: Props) {
  const currentIndex = useQuizStore(s => s.currentIndex)
  const questions = useQuizStore(s => s.questions)
  const answers = useQuizStore(s => s.answers)
  const markedIds = useQuizStore(s => s.markedIds)
  const textZoom = useQuizStore(s => s.textZoom)
  const isReverseColor = useQuizStore(s => s.isReverseColor)
  const next = useQuizStore(s => s.next)
  const prev = useQuizStore(s => s.prev)
  const toggleMark = useQuizStore(s => s.toggleMark)
  const toggleReverseColor = useQuizStore(s => s.toggleReverseColor)
  const setTextZoom = useQuizStore(s => s.setTextZoom)

  const current = questions[currentIndex]
  const isMarked = current ? markedIds.includes(current.id) : false
  const total = questions.length

  const bg = isReverseColor ? '#0d0d1a' : '#004976'
  const textColor = '#fff'

  return (
    <header
      style={{
        background: bg,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        height: 52,
        padding: '0 12px',
        gap: 16,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Left: info + mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
        <div style={{ fontSize: 13, lineHeight: 1.3 }}>
          <div style={{ fontWeight: 600 }}>Item: {currentIndex + 1} of {total}</div>
          <div style={{ opacity: 0.75, fontSize: 11 }}>Block: 1 of 1</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
          <input
            type="checkbox"
            checked={isMarked}
            onChange={() => current && toggleMark(current.id)}
            style={{ width: 14, height: 14, accentColor: '#fbbf24' }}
          />
          <span style={{ color: '#fbbf24' }}>▶</span>
          <span>Mark</span>
        </label>
      </div>

      {/* Center: navigation */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <NavBtn onClick={prev} disabled={currentIndex === 0} label="◄" title="Previous" />
        <span style={{ fontSize: 13, opacity: 0.8 }}>Previous</span>
        <span style={{ margin: '0 4px', opacity: 0.4 }}>|</span>
        <span style={{ fontSize: 13, opacity: 0.8 }}>Next</span>
        <NavBtn onClick={next} disabled={currentIndex === total - 1} label="►" title="Next" />
      </div>

      {/* Right: tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 260, justifyContent: 'flex-end' }}>
        <ToolBtn label="Lab Values" icon="🧪" />
        <ToolBtn label="Notes" icon="📝" />
        <ToolBtn label="Calculator" icon="🖩" />
        <ToolBtn
          label="Reverse Color"
          icon="◑"
          onClick={toggleReverseColor}
          active={isReverseColor}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 8 }}>
          <ToolBtn label="A-" icon="A" onClick={() => setTextZoom(Math.max(80, textZoom - 10))} small />
          <ToolBtn label="A" icon="A" onClick={() => setTextZoom(100)} />
          <ToolBtn label="A+" icon="A" onClick={() => setTextZoom(Math.min(140, textZoom + 10))} large />
        </div>
      </div>
    </header>
  )
}

function NavBtn({ onClick, disabled, label, title }: { onClick: () => void; disabled: boolean; label: string; title: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: 4,
        color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
        width: 28,
        height: 28,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </button>
  )
}

function ToolBtn({
  icon, label, onClick, active, small, large,
}: {
  icon: string
  label: string
  onClick?: () => void
  active?: boolean
  small?: boolean
  large?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
        border: 'none',
        borderRadius: 4,
        color: '#fff',
        padding: '4px 6px',
        cursor: 'pointer',
        fontSize: small ? 11 : large ? 17 : 13,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        opacity: onClick ? 1 : 0.6,
        transition: 'background 0.15s',
      }}
    >
      <span>{icon}</span>
      <span style={{ fontSize: 9, opacity: 0.8, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}
