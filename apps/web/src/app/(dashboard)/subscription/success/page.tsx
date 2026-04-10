import Link from 'next/link'

export default function SubscriptionSuccessPage() {
  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>You're on PRO!</h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>
        Your subscription is now active. Enjoy unlimited access to all quiz content.
      </p>
      <Link
        href="/quizzes"
        style={{
          padding: '14px 32px',
          background: '#2563eb',
          color: '#fff',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 16,
          display: 'inline-block',
        }}
      >
        Browse Quizzes →
      </Link>
    </div>
  )
}
