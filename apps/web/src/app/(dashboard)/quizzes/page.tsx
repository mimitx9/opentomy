import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const files = await container.getMyFiles.execute(session.user.id)

  const search = searchParams.search ?? ''
  const filtered = search
    ? files.filter(f => f.title.toLowerCase().includes(search.toLowerCase()))
    : files

  return (
    <div style={{ padding: '40px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>My Library</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
          {files.length === 0 ? 'No files yet' : `${files.length} quiz file${files.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <svg
            width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            name="search"
            defaultValue={search}
            placeholder="Search quizzes..."
            style={{
              width: '100%', padding: '9px 14px 9px 36px',
              border: '1px solid #e2e8f0', borderRadius: 9,
              fontSize: 14, background: '#fff', color: '#1e293b',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </form>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: '#fff', border: '2px dashed #e2e8f0', borderRadius: 12,
        }}>
          {search ? (
            <>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No results for &ldquo;{search}&rdquo;</p>
              <Link href="/quizzes" style={{ fontSize: 13, color: '#004976' }}>Clear search</Link>
            </>
          ) : (
            <>
              <p style={{ fontSize: 32, marginBottom: 12 }}>📚</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Your library is empty</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Upload a .tomy file to get started</p>
              <Link
                href="/files/upload"
                style={{ padding: '9px 20px', background: '#004976', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
              >
                Upload Now
              </Link>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map((f) => (
            <Link
              key={f.id}
              href={`/quizzes/${f.id}`}
              style={{
                display: 'flex', flexDirection: 'column', gap: 12,
                padding: '20px', background: '#fff',
                border: '1px solid #e2e8f0', borderRadius: 12,
                textDecoration: 'none', color: 'inherit',
              }}
            >
              {/* Icon + question count */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, background: '#eef5fb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#004976" strokeWidth={1.8}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: '#004976',
                  background: '#eef5fb', padding: '3px 9px', borderRadius: 99,
                }}>
                  {f.questionCount ?? 0} Qs
                </span>
              </div>

              {/* Title */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.4 }}>
                  {f.title}
                </h3>
                {f.description && (
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.description}
                  </p>
                )}
              </div>

              {/* Tags */}
              {f.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {f.tags.slice(0, 3).map((tag) => (
                    <span key={tag} style={{
                      fontSize: 11, padding: '2px 8px',
                      background: '#f1f5f9', color: '#64748b', borderRadius: 99,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Play CTA */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: '#004976', marginTop: 'auto',
              }}>
                <svg width="13" height="13" fill="#004976" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Play Quiz
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
