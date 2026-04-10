import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@opentomy/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [subscription, recentFiles] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    prisma.quizFile.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])

  const tier = subscription?.tier ?? 'FREE'
  const status = subscription?.status ?? null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/files/upload" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            + Upload Quiz
          </Link>
          <Link href="/subscription" style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}>
            {tier} plan
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Plan', value: tier },
          { label: 'Status', value: status ?? '—' },
          { label: 'Trial ends', value: subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : '—' },
        ].map(s => (
          <div key={s.label} style={{ padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontWeight: 700, fontSize: 18 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent Quizzes</h2>
      {recentFiles.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No quizzes yet. <Link href="/files/upload" style={{ color: '#2563eb' }}>Upload one.</Link></p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {recentFiles.map(f => (
            <Link key={f.id} href={`/quizzes/${f.id}`} style={{
              padding: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, display: 'block',
            }}>
              <h3 style={{ fontWeight: 600, marginBottom: 4 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>{f.questionCount} questions · {f.tags.join(', ')}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
