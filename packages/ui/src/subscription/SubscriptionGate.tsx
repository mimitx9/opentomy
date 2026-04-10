import React from 'react'

export interface SubscriptionGateProps {
  hasAccess: boolean
  tier: 'FREE' | 'PRO' | 'ENTERPRISE'
  trialEndsAt?: string | null
  onUpgrade: () => void
  onStartTrial?: () => void
  children: React.ReactNode
}

export function SubscriptionGate({
  hasAccess,
  tier,
  trialEndsAt,
  onUpgrade,
  onStartTrial,
  children,
}: SubscriptionGateProps) {
  if (hasAccess) return <>{children}</>

  const trialExpired = trialEndsAt && new Date(trialEndsAt) < new Date()
  const inTrial = trialEndsAt && new Date(trialEndsAt) >= new Date()

  return (
    <div style={{
      maxWidth: 480,
      margin: '40px auto',
      padding: 32,
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        {trialExpired ? 'Your trial has ended' : 'PRO subscription required'}
      </h3>
      <p style={{ color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
        {inTrial
          ? `You're on a free trial until ${new Date(trialEndsAt!).toLocaleDateString()}.`
          : 'Upgrade to PRO to unlock this quiz and all future content.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={onUpgrade}
          style={{
            padding: '12px 24px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Upgrade to PRO — $9.99/mo
        </button>
        {onStartTrial && tier === 'FREE' && !trialExpired && (
          <button
            onClick={onStartTrial}
            style={{
              padding: '12px 24px',
              background: 'none',
              color: '#2563eb',
              border: '1px solid #2563eb',
              borderRadius: 8,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Start 14-day free trial
          </button>
        )}
      </div>
    </div>
  )
}
