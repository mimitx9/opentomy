'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import Link from 'next/link'

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
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleLogin = () => {
    setIsRedirecting(true)
    signIn('keycloak', { callbackUrl: '/dashboard' })
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 64, height: 64,
          background: 'linear-gradient(135deg, #004976, #0070b8)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 4px 16px rgba(0,73,118,0.25)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
          Sign in to Opentomy
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
          Use your Opentomy account to continue
        </p>
      </div>

      {/* Success message */}
      {registered && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <p style={{ color: '#15803d', fontSize: 14, margin: 0, fontWeight: 500 }}>
            Account created! Sign in below.
          </p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10,
        }}>
          <p style={{ color: '#dc2626', fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>
            {errorCode}
          </p>
          <p style={{ color: '#b91c1c', fontSize: 13, margin: 0 }}>{errorMessage}</p>
        </div>
      )}

      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '32px 28px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        border: '1px solid #e2e8f0',
      }}>
        <button
          onClick={handleLogin}
          disabled={isRedirecting}
          style={{
            width: '100%',
            padding: '14px',
            background: isRedirecting ? '#93c5fd' : '#004976',
            color: '#fff',
            border: 'none',
            borderRadius: 99,
            fontWeight: 700,
            fontSize: 15,
            cursor: isRedirecting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.2s',
            letterSpacing: '0.01em',
          }}
        >
          {isRedirecting ? (
            <>
              <Spinner />
              Redirecting...
            </>
          ) : (
            <>
              <KeycloakIcon />
              Continue with Keycloak
            </>
          )}
        </button>

        <div style={{
          margin: '24px 0',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>secure authentication</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          You will be redirected to the Keycloak login page.
          <br />
          First time here? You can register on that page.
        </p>
      </div>

      {/* Footer link */}
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748b' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: '#004976', fontWeight: 600, textDecoration: 'none' }}>
          Sign up free
        </Link>
      </p>
    </div>
  )
}

function KeycloakIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
