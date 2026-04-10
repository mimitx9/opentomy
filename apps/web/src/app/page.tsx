import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}>
        Opentomy
      </h1>
      <p style={{ fontSize: 20, color: '#64748b', marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
        Distribute quiz content securely. Only your app can read it.
      </p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <Link href="/register" style={{
          padding: '14px 32px', background: '#2563eb', color: '#fff',
          borderRadius: 8, fontWeight: 600, fontSize: 16,
        }}>
          Get started free
        </Link>
        <Link href="/quizzes" style={{
          padding: '14px 32px', border: '1px solid #e2e8f0', borderRadius: 8,
          fontWeight: 600, fontSize: 16,
        }}>
          Browse quizzes
        </Link>
      </div>

      <div style={{ marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {[
          { icon: '🔒', title: '.optmy format', desc: 'AES-256 encrypted quiz files. Only your app decrypts them.' },
          { icon: '⚡', title: 'Instant access', desc: 'Server-issued tokens. 15-minute session keys.' },
          { icon: '💳', title: 'Subscription gated', desc: 'Free trial, then PRO at $9.99/mo.' },
        ].map(f => (
          <div key={f.title} style={{ padding: 24, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
