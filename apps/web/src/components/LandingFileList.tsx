'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface QuizFile {
  id: string
  title: string
  description?: string
  file_size?: number
  question_count?: number
}

function formatSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export default function LandingFileList() {
  const [files, setFiles] = useState<QuizFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/files?limit=10')
      .then(r => r.json())
      .then(data => setFiles(data.data ?? []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 64, background: '#f1f5f9', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    )
  }

  if (!files.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 14 }}>
        No public question banks available yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {files.map(file => (
        <Link
          key={file.id}
          href={`/quizzes/${file.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            textDecoration: 'none',
            color: '#1e293b',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = '#004976'
            el.style.boxShadow = '0 2px 8px rgba(0,73,118,0.08)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = '#e2e8f0'
            el.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: 28 }}>📚</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.title}
            </div>
            {file.description && (
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.description}
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            {file.question_count && (
              <div style={{ fontSize: 13, fontWeight: 600, color: '#004976' }}>{file.question_count} Qs</div>
            )}
            {file.file_size && (
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatSize(file.file_size)}</div>
            )}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 18 }}>›</div>
        </Link>
      ))}
    </div>
  )
}
