import { prisma } from '@opentomy/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string }
}) {
  const session = await getServerSession(authOptions)
  const page = parseInt(searchParams.page ?? '1')
  const limit = 12
  const search = searchParams.search ?? ''

  const where = {
    isPublic: true,
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [files, total] = await Promise.all([
    prisma.quizFile.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quizFile.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Browse Quizzes</h1>
        {session && (
          <Link
            href="/files/upload"
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
          >
            + Upload
          </Link>
        )}
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

      {files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p style={{ fontSize: 18 }}>No quizzes found</p>
          {session && (
            <Link href="/files/upload" style={{ marginTop: 12, display: 'inline-block', color: '#2563eb' }}>
              Upload the first one →
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
          {files.map((f) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/quizzes?page=${p}${search ? `&search=${search}` : ''}`}
              style={{
                padding: '6px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontWeight: p === page ? 700 : 400,
                background: p === page ? '#2563eb' : '#fff',
                color: p === page ? '#fff' : '#1e293b',
              }}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
