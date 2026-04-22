import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f0f7ff',
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #003d63 0%, #004976 50%, #005fa3 100%)',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 56px',
        color: '#fff',
        display: 'none',
      } as React.CSSProperties}
        className="auth-left-panel"
      >
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>Opentomy</div>
        <p style={{ fontSize: 17, opacity: 0.85, marginBottom: 56, lineHeight: 1.5 }}>
          Best-in-Class .tomy Reader<br />for USMLE Mastery
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {[
            { icon: '🔒', title: 'AES-256 Encrypted', desc: 'Question banks decrypt only inside your browser' },
            { icon: '⏱', title: 'USMLE-Style Interface', desc: 'Timed blocks, tutor mode, mark & review' },
            { icon: '📊', title: 'Instant Feedback', desc: 'Explanations, cross-out, progress tracking' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        minWidth: 0,
      }}>
        {children}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .auth-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
