'use client'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380, padding: 32, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Create account</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
          14-day free trial, no credit card required
        </p>
        <button
          onClick={() => signIn('keycloak', { callbackUrl: '/dashboard' })}
          style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15, marginBottom: 16 }}
        >
          Continue with Keycloak
        </button>
        <p style={{ fontSize: 13, color: '#64748b' }}>
          On the Keycloak page, click &ldquo;Register&rdquo; to create a new account.
        </p>
        <p style={{ marginTop: 16, fontSize: 14, color: '#64748b' }}>
          Already have an account? <Link href="/login" style={{ color: '#2563eb' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
