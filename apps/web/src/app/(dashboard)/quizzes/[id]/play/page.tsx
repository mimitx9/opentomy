'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { unpackQuiz } from '@opentomy/crypto'
import { QuizPlayer, QuizResult, SubscriptionGate } from '@opentomy/ui'
import type { QuizPayload, QuizAttemptAnswer, QuizAttemptResult } from '@opentomy/types'

const APP_MASTER_KEY = new Uint8Array(
  (process.env.NEXT_PUBLIC_APP_MASTER_KEY ?? '').match(/.{2}/g)?.map(b => parseInt(b, 16)) ?? []
)

type PlayState = 'loading' | 'no_access' | 'playing' | 'submitting' | 'result' | 'error'

export default function PlayPage() {
  const { id: fileId } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const router = useRouter()
  const [state, setState] = useState<PlayState>('loading')
  const [quiz, setQuiz] = useState<QuizPayload | null>(null)
  const [result, setResult] = useState<QuizAttemptResult | null>(null)
  const [accessInfo, setAccessInfo] = useState<{ tier: string; trialEndsAt?: string | null } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    loadAndDecrypt()
  }, [session, fileId])

  async function loadAndDecrypt() {
    setState('loading')
    try {
      // 1. Request decrypt token from server
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

      // 2. Fetch the .optmy file buffer
      const fileRes = await fetch(`/api/files/${fileId}/download`)
      if (!fileRes.ok) throw new Error('Failed to fetch file')
      const buffer = await fileRes.arrayBuffer()

      // 3. Decrypt in browser (WebCrypto) — key never touches server after this
      const { payload } = await unpackQuiz<QuizPayload>(APP_MASTER_KEY, decrypt_token, buffer)
      setQuiz(payload)
      setState('playing')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setState('error')
    }
  }

  const handleComplete = useCallback(async (answers: QuizAttemptAnswer[]) => {
    if (!quiz) return
    setState('submitting')
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, answers }),
      })
      const data = await res.json()
      setResult(data)
      setState('result')
    } catch {
      setState('result')
    }
    // Clear quiz from memory
    setQuiz(null)
  }, [quiz, fileId])

  if (!session) return <div style={{ padding: 40, textAlign: 'center' }}>Please sign in to play.</div>
  if (state === 'loading' || state === 'submitting') return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
  )
  if (state === 'error') return (
    <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>Error: {error}</div>
  )
  if (state === 'no_access') return (
    <SubscriptionGate
      hasAccess={false}
      tier={(accessInfo?.tier ?? 'FREE') as 'FREE' | 'PRO' | 'ENTERPRISE'}
      trialEndsAt={accessInfo?.trialEndsAt}
      onUpgrade={() => router.push('/subscription')}
    >
      {null}
    </SubscriptionGate>
  )
  if (state === 'result' && result) return (
    <QuizResult
      result={result}
      onRetry={() => loadAndDecrypt()}
      onExit={() => router.push('/quizzes')}
    />
  )
  if (state === 'playing' && quiz) return (
    <QuizPlayer
      quiz={quiz}
      onComplete={handleComplete}
      onExit={() => router.push(`/quizzes/${fileId}`)}
    />
  )
  return null
}
