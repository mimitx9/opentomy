import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { container } from '@/infrastructure/container'
import { STRIPE_PRICES } from '@/lib/config'

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { subscription: sub, tier, status } = await container.getSubscriptionStatus.execute(session.user.id)
  const isActive = status === 'ACTIVE' || status === 'TRIALING'

  const plans = [
    {
      name: 'FREE',
      price: '$0',
      period: 'forever',
      features: ['View quiz metadata', 'Browse public files', 'No quiz access'],
      priceId: null,
      cta: tier === 'FREE' ? 'Current plan' : null,
    },
    {
      name: 'PRO',
      price: '$9.99',
      period: '/month',
      features: ['Unlimited quiz access', 'Upload & share .optmy files', '14-day free trial', 'Creator tools'],
      priceId: STRIPE_PRICES.PRO_MONTHLY,
      cta: tier === 'PRO' ? 'Current plan' : 'Upgrade to PRO',
    },
    {
      name: 'PRO Yearly',
      price: '$89.99',
      period: '/year',
      features: ['Everything in PRO', 'Save 25%', 'Priority support'],
      priceId: STRIPE_PRICES.PRO_YEARLY,
      cta: 'Upgrade (save 25%)',
    },
  ]

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Subscription</h1>

      {/* Current status */}
      <div style={{ padding: 20, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, marginBottom: 32 }}>
        <p style={{ fontWeight: 600 }}>
          Current plan: <span style={{ color: '#0369a1' }}>{tier}</span>
          {status && <span style={{ marginLeft: 8, fontSize: 13, color: '#64748b' }}>({status})</span>}
        </p>
        {sub?.trialEndsAt && (
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Trial ends: {new Date(sub.trialEndsAt).toLocaleDateString()}
          </p>
        )}
        {sub?.currentPeriodEnd && status === 'ACTIVE' && (
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Next billing: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
        {isActive && tier !== 'FREE' && (
          <form action="/api/subscription/portal" method="POST" style={{ marginTop: 12 }}>
            <button
              type="submit"
              style={{ fontSize: 13, color: '#0369a1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Manage billing →
            </button>
          </form>
        )}
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {plans.map((plan) => (
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
            <ul style={{ listStyle: 'none', marginBottom: 24 }}>
              {plan.features.map((f) => (
                <li key={f} style={{ fontSize: 14, color: '#475569', marginBottom: 6 }}>
                  ✓ {f}
                </li>
              ))}
            </ul>
            {plan.priceId && plan.cta !== 'Current plan' ? (
              <form action="/api/subscription/checkout" method="POST">
                <input type="hidden" name="price_id" value={plan.priceId} />
                <input type="hidden" name="success_url" value={`${process.env.NEXTAUTH_URL}/subscription/success`} />
                <input type="hidden" name="cancel_url" value={`${process.env.NEXTAUTH_URL}/subscription`} />
                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '10px', background: '#2563eb', color: '#fff',
                    border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {plan.cta}
                </button>
              </form>
            ) : (
              <button
                disabled
                style={{
                  width: '100%', padding: '10px', background: '#f1f5f9', color: '#94a3b8',
                  border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'default',
                }}
              >
                {plan.cta ?? 'Get started'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
