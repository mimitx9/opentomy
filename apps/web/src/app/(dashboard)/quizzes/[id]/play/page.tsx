'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { SubscriptionGate } from '@opentomy/ui'
import { useQuizStore } from '@/lib/store/quizStore'
import type { SubjectStat, SystemStat } from '@/types/quizSession'
import CreateTestScreen from '@/components/quiz/CreateTestScreen'
import QuizLayout from '@/components/quiz/QuizLayout'
import QuestionDisplay from '@/components/quiz/QuestionDisplay'
import AnswerChoices from '@/components/quiz/AnswerChoices'


type PlayState = 'loading' | 'configure' | 'playing' | 'no_access' | 'error'

export default function PlayPage() {
  const { id: fileId } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const router = useRouter()

  const [state, setState] = useState<PlayState>('loading')
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([])
  const [systemStats, setSystemStats] = useState<SystemStat[]>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [accessInfo, setAccessInfo] = useState<{ tier: string; trialEndsAt?: string | null } | null>(null)
  const [error, setError] = useState('')

  const isEnded = useQuizStore(s => s.isEnded)
  const endBlock = useQuizStore(s => s.endBlock)
  const reset = useQuizStore(s => s.reset)

  const loadMetadata = useCallback(async () => {
    if (!session) return
    setState('loading')
    try {
      const fetchProxy = async (path: string) => {
        const res = await fetch(path, { credentials: 'include' })
        if (!res.ok) {
          const err = Object.assign(new Error(res.statusText), { status: res.status })
          throw err
        }
        return res.json()
      }

      const [subjectsData, systemsData] = await Promise.all([
        fetchProxy(`/api/files/${fileId}/subjects`) as Promise<{ id: number; code: string; name: string; sortOrder: number; questionCount: number }[]>,
        fetchProxy(`/api/files/${fileId}/systems`) as Promise<{ name: string; questionCount: number }[]>,
      ])

      const subjects: SubjectStat[] = subjectsData.map(s => ({
        subject: { id: s.id, code: s.code, name: s.name, sort_order: s.sortOrder },
        questionCount: s.questionCount,
      }))

      setSubjectStats(subjects)
      setSystemStats(systemsData)
      setTotalQuestions(subjectsData.reduce((sum, s) => sum + s.questionCount, 0))
      setState('configure')
    } catch (e) {
      const status = e instanceof Error && 'status' in e ? (e as { status: number }).status : 0
      if (status === 403 || status === 402) {
        setAccessInfo({ tier: 'FREE', trialEndsAt: null })
        setState('no_access')
        return
      }
      setError(e instanceof Error ? e.message : 'Unknown error')
      setState('error')
    }
  }, [fileId, session])

  useEffect(() => {
    if (!session) return
    reset()
    loadMetadata()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, fileId])

  const handleEndBlock = useCallback(() => { endBlock() }, [endBlock])

  if (!session) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Please sign in to play.</div>
  }

  if (state === 'loading') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>Loading quiz...</div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>Error: {error}</div>
        <button
          onClick={loadMetadata}
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

  if (state === 'configure') {
    return (
      <CreateTestScreen
        fileId={fileId}
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
