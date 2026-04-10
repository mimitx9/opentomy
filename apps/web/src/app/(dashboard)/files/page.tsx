'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { QuizFileRecord } from '@opentomy/types'

export default function FilesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<QuizFileRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/files/mine')
      .then((r) => r.json())
      .then((d) => { setFiles(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session])

  async function handleDelete(id: string) {
    if (!confirm('Delete this quiz file?')) return
    await fetch(`/api/files/${id}`, { method: 'DELETE' })
    setFiles((f) => f.filter((x) => x.id !== id))
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Quiz Files</h1>
        <Link
          href="/files/upload"
          style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
        >
          + Upload .optmy
        </Link>
      </div>

      {files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p style={{ fontSize: 18, marginBottom: 12 }}>No quiz files yet</p>
          <Link href="/files/upload" style={{ color: '#2563eb' }}>Upload your first .optmy file →</Link>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              {['Title', 'Questions', 'Tags', 'Uploaded', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 500 }}>
                  <Link href={`/quizzes/${f.id}`} style={{ color: '#2563eb' }}>{f.title}</Link>
                </td>
                <td style={{ padding: '12px', color: '#64748b', fontSize: 14 }}>{f.questionCount}</td>
                <td style={{ padding: '12px', fontSize: 13, color: '#64748b' }}>{f.tags.join(', ')}</td>
                <td style={{ padding: '12px', fontSize: 13, color: '#64748b' }}>
                  {new Date(f.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={() => handleDelete(f.id)}
                    style={{ fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
