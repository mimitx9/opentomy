'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiGet, apiDelete } from '@/lib/apiClient'
import type { QuizFileRecord } from '@opentomy/types'

export default function FilesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<QuizFileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    apiGet<{ data: QuizFileRecord[]; total: number }>('/files/mine', session.accessToken)
      .then((d) => { setFiles(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session])

  async function handleDelete(id: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeletingId(id)
    await apiDelete(`/files/${id}`, session!.accessToken).catch(() => null)
    setFiles((f) => f.filter((x) => x.id !== id))
    setDeletingId(null)
  }

  function formatSize(bytes?: number) {
    if (!bytes) return ''
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  if (loading) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ height: 28, width: 140, background: '#f1f5f9', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 16, width: 80, background: '#f1f5f9', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 72, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>My Files</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            {files.length === 0 ? 'No files yet' : `${files.length} file${files.length !== 1 ? 's' : ''} uploaded`}
          </p>
        </div>
        <Link
          href="/files/upload"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', background: '#004976', color: '#fff',
            borderRadius: 9, fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload .tomy
        </Link>
      </div>

      {files.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: '#fff', border: '2px dashed #e2e8f0', borderRadius: 12,
        }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📁</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>No files uploaded yet</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Upload a .tomy file to add it to your library</p>
          <Link
            href="/files/upload"
            style={{ padding: '9px 20px', background: '#004976', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            Upload Now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {files.map((f) => (
            <div
              key={f.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px', background: '#fff',
                border: '1px solid #e2e8f0', borderRadius: 10,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 9, background: '#eef5fb', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#004976" strokeWidth={1.8}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                  <Link
                    href={`/quizzes/${f.id}`}
                    style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {f.title}
                  </Link>
                  <span style={{ fontSize: 11, color: '#004976', background: '#eef5fb', padding: '1px 7px', borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>
                    {f.questionCount ?? 0} Qs
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#94a3b8' }}>
                  {f.fileSize && <span>{formatSize(f.fileSize)}</span>}
                  <span>{new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {f.tags.length > 0 && <span>{f.tags.slice(0, 2).join(', ')}</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Link
                  href={`/quizzes/${f.id}/play`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', background: '#004976', color: '#fff',
                    borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  <svg width="11" height="11" fill="#fff" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
                  Play
                </Link>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={deletingId === f.id}
                  style={{
                    padding: '6px 12px', background: 'none',
                    border: '1px solid #fee2e2', borderRadius: 7,
                    fontSize: 13, color: '#dc2626', cursor: 'pointer',
                    opacity: deletingId === f.id ? 0.5 : 1,
                  }}
                >
                  {deletingId === f.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
