'use client'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  Callback: 'Sign-in failed — could not connect to the database. Check server logs.',
  OAuthSignin: 'Could not start OAuth sign-in. Check Keycloak configuration.',
  OAuthCallback: 'OAuth callback error. Check KEYCLOAK_ISSUER and redirect URIs.',
  OAuthAccountNotLinked: 'Account already linked to another provider.',
  AccessDenied: 'Access denied.',
  Verification: 'Verification failed.',
  Default: 'An unexpected error occurred.',
}

function LoginContent() {
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const errorCode = searchParams.get('error')
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default) : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 420, padding: 32, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sign in</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
          Authenticate with your account to continue
        </p>
        {registered && (
          <p style={{ color: '#16a34a', fontSize: 14, marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8 }}>
            Account created! Sign in below.
          </p>
        )}
        {errorMessage && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, textAlign: 'left' }}>
            <p style={{ color: '#dc2626', fontSize: 14, fontWeight: 600, margin: 0 }}>Error: {errorCode}</p>
            <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0' }}>{errorMessage}</p>
          </div>
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
