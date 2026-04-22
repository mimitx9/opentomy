'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { unpackRaw } from '@opentomy/crypto'
import { SubscriptionGate } from '@opentomy/ui'
import { loadDatabase, getSubjectStats, getSystemStats, getTotalQuestions } from '@/lib/sqlite/sqliteReader'
import { useQuizStore } from '@/lib/store/quizStore'
import type { SubjectStat, SystemStat } from '@/types/quizSession'
import CreateTestScreen from '@/components/quiz/CreateTestScreen'
import QuizLayout from '@/components/quiz/QuizLayout'
import QuestionDisplay from '@/components/quiz/QuestionDisplay'
import AnswerChoices from '@/components/quiz/AnswerChoices'

const APP_MASTER_KEY = new Uint8Array(
  (process.env.NEXT_PUBLIC_APP_MASTER_KEY ?? '').match(/.{2}/g)?.map(b => parseInt(b, 16)) ?? []
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlJsDatabase = any

type PlayState = 'loading' | 'configure' | 'playing' | 'no_access' | 'error'

export default function PlayPage() {
  const { id: fileId } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const router = useRouter()

  const [state, setState] = useState<PlayState>('loading')
  const [db, setDb] = useState<SqlJsDatabase>(null)
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([])
  const [systemStats, setSystemStats] = useState<SystemStat[]>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [accessInfo, setAccessInfo] = useState<{ tier: string; trialEndsAt?: string | null } | null>(null)
  const [error, setError] = useState('')

  const isEnded = useQuizStore(s => s.isEnded)
  const endBlock = useQuizStore(s => s.endBlock)
  const reset = useQuizStore(s => s.reset)

  const loadAndDecrypt = useCallback(async () => {
    setState('loading')
    try {
      // 1. Request decrypt token
      const tokenRes = await fetch('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
      })

      if (tokenRes.status === 402 || tokenRes.status === 403) {
        const data = await tokenRes.json()
        setAccessInfo({ tier: data.tier ?? 'FREE', trialEndsAt: data.trial_ends_at })
        setState('no_access')
        return
      }

      if (!tokenRes.ok) throw new Error('Failed to get decrypt token')
      const { decrypt_token } = await tokenRes.json()

      // 2. Download .optmy file
      const fileRes = await fetch(`/api/files/${fileId}/download`)
      if (!fileRes.ok) throw new Error('Failed to fetch file')
      const buffer = await fileRes.arrayBuffer()

      // 3. Decrypt raw SQLite bytes
      const { payload: sqliteBytes } = await unpackRaw(APP_MASTER_KEY, decrypt_token, buffer)
      const sqliteBuffer = sqliteBytes.buffer.slice(sqliteBytes.byteOffset, sqliteBytes.byteOffset + sqliteBytes.byteLength) as ArrayBuffer

      // 4. Load into sql.js
      const database = await loadDatabase(sqliteBuffer)
      setDb(database)

      // 5. Read metadata for CreateTestScreen
      const subjects = getSubjectStats(database)
      const systems = getSystemStats(database)
      const total = getTotalQuestions(database)
      setSubjectStats(subjects)
      setSystemStats(systems)
      setTotalQuestions(total)

      setState('configure')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setState('error')
    }
  }, [fileId])

  useEffect(() => {
    if (!session) return
    reset()
    loadAndDecrypt()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, fileId])

  const handleEndBlock = useCallback(() => {
    endBlock()
  }, [endBlock])

  if (!session) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Please sign in to play.</div>
  }

  if (state === 'loading') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>Decrypting file...</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading SQLite database</div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>Error: {error}</div>
        <button
          onClick={loadAndDecrypt}
          style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (state === 'no_access') {
    return (
      <SubscriptionGate
        hasAccess={false}
        tier={(accessInfo?.tier ?? 'FREE') as 'FREE' | 'PRO' | 'ENTERPRISE'}
        trialEndsAt={accessInfo?.trialEndsAt}
        onUpgrade={() => router.push('/subscription')}
      >
        {null}
      </SubscriptionGate>
    )
  }

  if (state === 'configure' && db) {
    return (
      <CreateTestScreen
        db={db}
        subjectStats={subjectStats}
        systemStats={systemStats}
        totalQuestions={totalQuestions}
        onStart={() => setState('playing')}
      />
    )
  }

  if (state === 'playing') {
    if (isEnded) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Block Complete</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            You have completed this quiz block. Review your answers above.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => { reset(); setState('configure') }}
              style={{ padding: '10px 24px', background: '#004976', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
            >
              New Test
            </button>
            <button
              onClick={() => router.push('/quizzes')}
              style={{ padding: '10px 24px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}
            >
              Back to Library
            </button>
          </div>
        </div>
      )
    }

    return (
      <QuizLayout onEndBlock={handleEndBlock}>
        <QuestionDisplay />
        <AnswerChoices />
      </QuizLayout>
    )
  }

  return null
}
