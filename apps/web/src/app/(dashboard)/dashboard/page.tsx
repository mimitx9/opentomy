import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { apiGet } from '@/lib/apiClient'
import Link from 'next/link'
import type { QuizFileRecord } from '@opentomy/types'

type SubscriptionStatus = {
  tier: string
  status: string | null
  trial_ends_at: string | null
  subscription: { trial_ends_at?: string | null; current_period_end?: string | null } | null
}

type FilesResponse = {
  data: QuizFileRecord[]
  total: number
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const token = session.accessToken

  const [{ tier, status, trial_ends_at }, filesData] = await Promise.all([
    apiGet<SubscriptionStatus>('/subscription/status', token).catch(() => ({
      tier: 'FREE',
      status: null,
      trial_ends_at: null,
      subscription: null,
    })),
    apiGet<FilesResponse>('/files/mine', token).catch(() => ({ data: [], total: 0 })),
  ])

  const myFiles = filesData.data ?? []
  const totalQuestions = myFiles.reduce((acc, f) => acc + (f.questionCount ?? 0), 0)
  const recentFiles = myFiles.slice(0, 4)

  const tierColor = tier === 'PRO' ? '#004976' : '#64748b'
  const tierBg = tier === 'PRO' ? '#eef5fb' : '#f8fafc'

  return (
    <div style={{ padding: '40px 40px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''} 👋
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
        <StatCard
          label="Quiz Files"
          value={myFiles.length.toString()}
          sub="uploaded"
          accent="#004976"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#004976" strokeWidth={1.8}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Total Questions"
          value={totalQuestions > 0 ? totalQuestions.toLocaleString() : '—'}
          sub="across all files"
          accent="#2563eb"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r="0.5" fill="#2563eb" />
            </svg>
          }
        />
        <StatCard
          label="Plan"
          value={tier}
          sub={
            status === 'TRIALING'
              ? `trial ends ${trial_ends_at ? new Date(trial_ends_at).toLocaleDateString() : '—'}`
              : status?.toLowerCase() ?? 'free'
          }
          accent={tierColor}
          bg={tierBg}
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={tierColor} strokeWidth={1.8}>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
        <Link
          href="/files/upload"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#004976', color: '#fff',
            borderRadius: 9, fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload .tomy File
        </Link>
        <Link
          href="/quizzes"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#fff', color: '#374151',
            border: '1px solid #e2e8f0', borderRadius: 9, fontWeight: 500, fontSize: 14, textDecoration: 'none',
          }}
        >
          Browse Library →
        </Link>
      </div>

      {/* Recent Files */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Files</h2>
          {myFiles.length > 4 && (
            <Link href="/quizzes" style={{ fontSize: 13, color: '#004976', textDecoration: 'none', fontWeight: 500 }}>
              View all →
            </Link>
          )}
        </div>

        {recentFiles.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: '#fff', border: '2px dashed #e2e8f0', borderRadius: 12,
          }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📁</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>No quiz files yet</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Upload your first .tomy file to get started</p>
            <Link
              href="/files/upload"
              style={{ padding: '9px 20px', background: '#004976', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Upload Now
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {recentFiles.map(f => (
              <Link
                key={f.id}
                href={`/quizzes/${f.id}`}
                style={{
                  display: 'block', padding: '18px 20px',
                  background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: 10, textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.title}
                  </h3>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#004976', background: '#eef5fb', padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {f.questionCount ?? 0} Qs
                  </span>
                </div>
                {f.tags.length > 0 && (
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, margin: '6px 0 0' }}>
                    {f.tags.slice(0, 3).join(' · ')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, sub, accent = '#004976', bg = '#fff', icon,
}: {
  label: string
  value: string
  sub: string
  accent?: string
  bg?: string
  icon: React.ReactNode
}) {
  return (
    <div style={{
      background: bg,
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <div style={{ opacity: 0.85 }}>{icon}</div>
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 700, color: accent, margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>{sub}</p>
      </div>
    </div>
  )
}
