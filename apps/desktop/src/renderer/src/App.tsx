import React, { useState, useEffect, useCallback } from 'react'
import { QuizPlayer, QuizResult, SubscriptionGate } from '@opentomy/ui'
import type { QuizPayload, QuizAttemptAnswer, QuizAttemptResult, OptmyFileHeader } from '@opentomy/types'

const API_BASE = process.env.VITE_API_URL ?? 'https://opentomy.com'

type AppState =
  | { screen: 'home' }
  | { screen: 'login' }
  | { screen: 'file_preview'; path: string; header: OptmyFileHeader; flags: number }
  | { screen: 'loading' }
  | { screen: 'no_access'; tier: string; trialEndsAt?: string | null }
  | { screen: 'playing'; quiz: QuizPayload; fileId: string }
  | { screen: 'result'; result: QuizAttemptResult }
  | { screen: 'error'; message: string }

export function App() {
  const [state, setState] = useState<AppState>({ screen: 'home' })
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  useEffect(() => {
    // Load session from keychain on startup
    window.optmy.getSession().then(token => {
      if (token) setSessionToken(token)
    })

    // Listen for file opened events (double-click .optmy)
    const cleanup = window.optmy.onFileOpened(async (path) => {
      await handleFileOpen(path)
    })
    return cleanup
  }, [])

  const handleFileOpen = useCallback(async (path: string) => {
    setState({ screen: 'loading' })
    try {
      const result = await window.optmy.readFileHeader(path)
      if (!result) throw new Error('Could not read file')
      setState({
        screen: 'file_preview',
        path,
        header: result.header as OptmyFileHeader,
        flags: result.flags,
      })
    } catch (e) {
      setState({ screen: 'error', message: e instanceof Error ? e.message : 'Unknown error' })
    }
  }, [])

  const handleOpenDialog = useCallback(async () => {
    const path = await window.optmy.openFileDialog()
    if (path) await handleFileOpen(path)
  }, [handleFileOpen])

  const handlePlay = useCallback(async (path: string, fileId: string) => {
    if (!sessionToken) {
      setState({ screen: 'login' })
      return
    }
    setState({ screen: 'loading' })
    try {
      // Request decrypt token from server
      const res = await fetch(`${API_BASE}/api/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ file_id: fileId }),
      })
      if (res.status === 403 || res.status === 402) {
        const data = await res.json()
        setState({ screen: 'no_access', tier: data.tier ?? 'FREE', trialEndsAt: data.trial_ends_at })
        return
      }
      const { decrypt_token } = await res.json()

      // Read file buffer and decrypt in main process
      const base64 = await window.optmy.readFileBuffer(path)
      const { payload } = await window.optmy.executeDecrypt(base64, decrypt_token)

      setState({ screen: 'playing', quiz: payload as QuizPayload, fileId })
    } catch (e) {
      setState({ screen: 'error', message: e instanceof Error ? e.message : 'Decrypt failed' })
    }
  }, [sessionToken])

  const handleComplete = useCallback(async (answers: QuizAttemptAnswer[], fileId: string) => {
    const correctCount = answers.filter(a => a.is_correct).length
    const result: QuizAttemptResult = {
      attempt_id: crypto.randomUUID(),
      quiz_id: fileId,
      score: correctCount,
      max_score: answers.length,
      percent: (correctCount / answers.length) * 100,
      passed: (correctCount / answers.length) >= 0.6,
      answers,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }
    setState({ screen: 'result', result })
  }, [])

  // ─── Screens ────────────────────────────────────────────────────────────────

  if (state.screen === 'loading') {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
  }

  if (state.screen === 'error') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#dc2626', marginBottom: 16 }}>{state.message}</p>
        <button onClick={() => setState({ screen: 'home' })} style={btnStyle}>Back</button>
      </div>
    )
  }

  if (state.screen === 'no_access') {
    return (
      <SubscriptionGate
        hasAccess={false}
        tier={state.tier as 'FREE' | 'PRO' | 'ENTERPRISE'}
        trialEndsAt={state.trialEndsAt}
        onUpgrade={() => setState({ screen: 'home' })}
      >
        {null}
      </SubscriptionGate>
    )
  }

  if (state.screen === 'playing') {
    return (
      <QuizPlayer
        quiz={state.quiz}
        onComplete={(answers) => handleComplete(answers, state.fileId)}
        onExit={() => setState({ screen: 'home' })}
      />
    )
  }

  if (state.screen === 'result') {
    return (
      <QuizResult
        result={state.result}
        onRetry={() => setState({ screen: 'home' })}
        onExit={() => setState({ screen: 'home' })}
      />
    )
  }

  if (state.screen === 'file_preview') {
    const { path, header } = state
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: 32, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{header.title}</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 4 }}>{header.question_count} questions · v{header.content_version}</p>
        {header.tags.length > 0 && <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>{header.tags.join(', ')}</p>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => handlePlay(path, header.file_id)} style={{ ...btnStyle, background: '#2563eb', color: '#fff', border: 'none' }}>
            Play Quiz
          </button>
          <button onClick={() => setState({ screen: 'home' })} style={btnStyle}>Cancel</button>
        </div>
      </div>
    )
  }

  // Home screen
  return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: 32, textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Opentomy</h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>Open a .optmy quiz file to get started</p>
      <button onClick={handleOpenDialog} style={{ ...btnStyle, background: '#2563eb', color: '#fff', border: 'none', padding: '14px 32px', fontSize: 16 }}>
        Open Quiz File
      </button>
      {!sessionToken && (
        <p style={{ marginTop: 24, fontSize: 14, color: '#94a3b8' }}>
          Not signed in — you'll be prompted when you open a file
        </p>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 14,
  background: '#fff',
}
