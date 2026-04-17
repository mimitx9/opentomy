'use client'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380, padding: 32, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sign in</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
          Authenticate with your account to continue
        </p>
        {registered && (
          <p style={{ color: '#16a34a', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8 }}>
            Account created! Sign in below.
          </p>
        )}
        <button
          onClick={() => signIn('keycloak', { callbackUrl: '/dashboard' })}
          style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}
        >
          Sign in with Keycloak
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
