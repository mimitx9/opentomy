'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380, padding: 32, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Sign in</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            required style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15 }}
          />
          <input
            type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            required style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15 }}
          />
          {error && <p style={{ color: '#dc2626', fontSize: 14 }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            style={{ padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
          No account? <Link href="/register" style={{ color: '#2563eb' }}>Register free</Link>
        </p>
      </div>
    </div>
  )
}
