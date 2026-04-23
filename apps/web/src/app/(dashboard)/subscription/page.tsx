'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/apiClient'

type SubscriptionData = {
  tier: string
  status: string | null
  trial_ends_at: string | null
  subscription: {
    trial_ends_at?: string | null
    current_period_end?: string | null
  } | null
  checkout_url?: string
}

const PLANS = [
  {
    name: 'FREE',
    price: '$0',
    period: 'forever',
    features: ['View quiz metadata', 'Browse public files', 'No quiz access'],
    priceId: null,
  },
  {
    name: 'PRO',
    price: '$9.99',
    period: '/month',
    features: ['Unlimited quiz access', 'Upload & share .optmy files', '14-day free trial', 'Creator tools'],
    priceId: 'pro_monthly',
  },
  {
    name: 'PRO Yearly',
    price: '$89.99',
    period: '/year',
    features: ['Everything in PRO', 'Save 25%', 'Priority support'],
    priceId: 'pro_yearly',
  },
]

export default function SubscriptionPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  useEffect(() => {
    if (!session) return
    apiGet<SubscriptionData>('/subscription/status', session.accessToken)
      .then(setData)
      .catch(() => setData({ tier: 'FREE', status: null, trial_ends_at: null, subscription: null }))
      .finally(() => setLoading(false))
  }, [session])

  async function handleCheckout(priceId: string) {
    if (!session) return
    setCheckoutLoading(priceId)
    try {
      const origin = window.location.origin
      const result = await apiPost<{ checkout_url: string }>('/subscription/checkout', session.accessToken, {
        price_id: priceId,
        success_url: `${origin}/subscription/success`,
        cancel_url: `${origin}/subscription`,
      })
      window.location.href = result.checkout_url
    } catch {
      alert('Failed to start checkout. Please try again.')
      setCheckoutLoading(null)
    }
  }

  async function handlePortal() {
    if (!session) return
    try {
      const result = await apiPost<{ portal_url: string }>('/subscription/portal', session.accessToken, {
        return_url: `${window.location.origin}/subscription`,
      })
      window.location.href = result.portal_url
    } catch {
      alert('Failed to open billing portal. Please try again.')
    }
  }

  if (loading || !data) {
    return <div style={{ padding: 32, color: '#94a3b8' }}>Loading...</div>
  }

  const { tier, status, trial_ends_at, subscription: sub } = data
  const isActive = status === 'ACTIVE' || status === 'TRIALING'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Subscription</h1>

      {/* Current status */}
      <div style={{ padding: 20, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, marginBottom: 32 }}>
        <p style={{ fontWeight: 600 }}>
          Current plan: <span style={{ color: '#0369a1' }}>{tier}</span>
          {status && <span style={{ marginLeft: 8, fontSize: 13, color: '#64748b' }}>({status})</span>}
        </p>
        {trial_ends_at && (
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Trial ends: {new Date(trial_ends_at).toLocaleDateString()}
          </p>
        )}
        {sub?.current_period_end && status === 'ACTIVE' && (
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Next billing: {new Date(sub.current_period_end).toLocaleDateString()}
          </p>
        )}
        {isActive && tier !== 'FREE' && (
          <button
            onClick={handlePortal}
            style={{ marginTop: 12, fontSize: 13, color: '#0369a1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Manage billing →
          </button>
        )}
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {PLANS.map((plan) => {
          const isCurrent = tier === plan.name || (plan.name === 'FREE' && tier === 'FREE')
          return (
            <div
              key={plan.name}
              style={{
                padding: 24,
                background: '#fff',
                border: plan.name === 'PRO' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: 12,
              }}
            >
              {plan.name === 'PRO' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Most Popular
                </div>
              )}
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 800 }}>{plan.price}</span>
                <span style={{ color: '#64748b', fontSize: 14 }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: 24, padding: 0 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: 14, color: '#475569', marginBottom: 6 }}>
                    ✓ {f}
                  </li>
                ))}
              </ul>
              {plan.priceId && !isCurrent ? (
                <button
                  onClick={() => handleCheckout(plan.priceId!)}
                  disabled={checkoutLoading === plan.priceId}
                  style={{
                    width: '100%', padding: '10px', background: checkoutLoading === plan.priceId ? '#93c5fd' : '#2563eb',
                    color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {checkoutLoading === plan.priceId ? 'Loading...' : plan.name === 'PRO Yearly' ? 'Upgrade (save 25%)' : 'Upgrade to PRO'}
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    width: '100%', padding: '10px', background: '#f1f5f9', color: '#94a3b8',
                    border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'default',
                  }}
                >
                  {isCurrent ? 'Current plan' : 'Get started'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
