import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const files = await container.getMyFiles.execute(session.user.id)

  const search = searchParams.search ?? ''
  const filtered = search
    ? files.filter(f => f.title.toLowerCase().includes(search.toLowerCase()))
    : files

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Library</h1>
        <Link
          href="/files/upload"
          style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
        >
          + Upload
        </Link>
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 24 }}>
        <input
          name="search"
          defaultValue={search}
          placeholder="Search quizzes..."
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15 }}
        />
      </form>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p style={{ fontSize: 18 }}>{search ? 'No quizzes matched your search' : 'No quizzes yet'}</p>
          <Link href="/files/upload" style={{ marginTop: 12, display: 'inline-block', color: '#2563eb' }}>
            Upload your first .tomy file →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
          {filtered.map((f) => (
            <Link
              key={f.id}
              href={`/quizzes/${f.id}`}
              style={{
                padding: 20,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                display: 'block',
                transition: 'box-shadow 0.15s',
              }}
            >
              <h3 style={{ fontWeight: 600, marginBottom: 6, fontSize: 16 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                {f.questionCount} questions
              </p>
              {f.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {f.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        borderRadius: 99,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
