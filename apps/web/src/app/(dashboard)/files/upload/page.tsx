'use client'
import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiUpload } from '@/lib/apiClient'

export default function UploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  if (!session) {
    router.push('/login')
    return null
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.optmy')) setFile(f)
    else setError('Only .optmy files are accepted')
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const data = await apiUpload<{ file: { id: string } }>('/files/upload', session!.accessToken, form)
      router.push(`/quizzes/${data.file.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Upload Quiz</h1>
      <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>
        Upload a <code>.optmy</code> file to publish it on Opentomy
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? '#eff6ff' : '#f8fafc',
          transition: 'all 0.15s',
          marginBottom: 24,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".optmy"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setFile(f)
          }}
        />
        {file ? (
          <div>
            <p style={{ fontWeight: 600, fontSize: 16 }}>📄 {file.name}</p>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 36, marginBottom: 8 }}>📂</p>
            <p style={{ fontWeight: 600 }}>Drag & drop your .optmy file here</p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>or click to browse</p>
          </div>
        )}
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          width: '100%',
          padding: '14px',
          background: file && !uploading ? '#2563eb' : '#94a3b8',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 16,
          cursor: file && !uploading ? 'pointer' : 'default',
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Quiz'}
      </button>
    </div>
  )
}
