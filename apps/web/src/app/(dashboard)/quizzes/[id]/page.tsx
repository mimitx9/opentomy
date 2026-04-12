import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { container } from '@/infrastructure/container'
import Link from 'next/link'

export default async function QuizDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  const { file, access } = await container.getFileWithAccess.execute(
    params.id,
    session?.user?.id,
  ).catch(() => notFound())

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 32 }}>
      <Link href="/quizzes" style={{ color: '#64748b', fontSize: 14, marginBottom: 20, display: 'block' }}>
        ← Back to quizzes
      </Link>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{file.title}</h1>
        {file.description && (
          <p style={{ color: '#64748b', marginBottom: 16 }}>{file.description}</p>
        )}

        <div style={{ display: 'flex', gap: 24, marginBottom: 24, fontSize: 14, color: '#64748b' }}>
          <span>📝 {file.questionCount} questions</span>
          <span>📅 {new Date(file.createdAt).toLocaleDateString()}</span>
        </div>

        {file.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {file.tags.map((tag) => (
              <span key={tag} style={{ fontSize: 12, padding: '3px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: 99 }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
          {!session ? (
            <div>
              <p style={{ color: '#64748b', marginBottom: 16 }}>Sign in to play this quiz</p>
              <Link href="/login" style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 600 }}>
                Sign in
              </Link>
            </div>
          ) : access.hasAccess ? (
            <Link
              href={`/quizzes/${params.id}/play`}
              style={{ padding: '14px 32px', background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 16, display: 'inline-block' }}
            >
              ▶ Play Quiz
            </Link>
          ) : (
            <div>
              <p style={{ color: '#64748b', marginBottom: 16 }}>
                🔒 PRO subscription required to play this quiz
              </p>
              <Link
                href="/subscription"
                style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 600, display: 'inline-block' }}
              >
                Upgrade to PRO
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
