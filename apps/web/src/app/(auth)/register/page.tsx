'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Registration failed')
    } else {
      router.push('/login?registered=1')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380, padding: 32, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Create account</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>14-day free trial, no credit card required</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15 }}
          />
          <input
            type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15 }}
          />
          <input
            type="password" placeholder="Password (min 8 chars)" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            minLength={8} required
            style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15 }}
          />
          {error && <p style={{ color: '#dc2626', fontSize: 14 }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            style={{ padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? 'Creating account...' : 'Create account — start free trial'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
          Already have an account? <Link href="/login" style={{ color: '#2563eb' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
