'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
    </svg>
  )
}

export default function RegisterPage() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleRegister = () => {
    setIsRedirecting(true)
    // Keycloak handles registration on its own page
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
          Create your account
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
          14-day free trial · No credit card required
        </p>
      </div>

      {/* Benefits */}
      <div style={{
        marginBottom: 24,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {[
          { icon: '✅', text: 'Full access to all question banks' },
          { icon: '✅', text: 'USMLE-style timed & tutor modes' },
          { icon: '✅', text: 'Detailed explanations & progress tracking' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 14, color: '#374151' }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '28px 28px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        border: '1px solid #e2e8f0',
      }}>
        <button
          onClick={handleRegister}
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
            'Get Started Free'
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: '16px 0 0', lineHeight: 1.6 }}>
          You&apos;ll be redirected to create your account securely via Keycloak.
          <br />
          Click &ldquo;Register&rdquo; on the Keycloak page if you&apos;re new.
        </p>
      </div>

      {/* Footer links */}
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748b' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#004976', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>

      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
        By continuing, you agree to our{' '}
        <span style={{ color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>
        {' '}and{' '}
        <span style={{ color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
      </p>
    </div>
  )
}
