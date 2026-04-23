'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useQuizStore } from '@/lib/store/quizStore'
import { apiPost } from '@/lib/apiClient'
import type { SubjectStat, SystemStat, QuizMode, QuizQuestion } from '@/types/quizSession'

interface Props {
  fileId: string
  subjectStats: SubjectStat[]
  systemStats: SystemStat[]
  totalQuestions: number
  onStart: () => void
}

export default function CreateTestScreen({ fileId, subjectStats, systemStats, totalQuestions, onStart }: Props) {
  const { data: session } = useSession()
  const loadQuestions = useQuizStore(s => s.loadQuestions)

  const [mode, setMode] = useState<QuizMode>('tutor')
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [numQuestions, setNumQuestions] = useState(40)
  const [isGenerating, setIsGenerating] = useState(false)

  const toggleSubject = useCallback((id: number) => {
    setSelectedSubjectIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }, [])

  const toggleSystem = useCallback((name: string) => {
    setSelectedSystems(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    )
  }, [])

  const selectAllSubjects = () => setSelectedSubjectIds(subjectStats.map(s => s.subject.id))
  const clearSubjects = () => setSelectedSubjectIds([])
  const selectAllSystems = () => setSelectedSystems(systemStats.map(s => s.name))
  const clearSystems = () => setSelectedSystems([])

  const handleGenerate = useCallback(async () => {
    if (!session) return
    setIsGenerating(true)
    try {
      const questions = await apiPost<QuizQuestion[]>(`/files/${fileId}/questions`, session.accessToken, {
        subjectIds: selectedSubjectIds.length > 0 ? selectedSubjectIds : undefined,
        systems: selectedSystems.length > 0 ? selectedSystems : undefined,
        limit: numQuestions,
        shuffle: true,
      })

      if (!questions || questions.length === 0) {
        alert('No questions found matching the selected filters.')
        return
      }

      const timeLimitSeconds = mode === 'timed' ? numQuestions * 90 : undefined
      loadQuestions(questions, mode, timeLimitSeconds)
      onStart()
    } catch {
      alert('Failed to load questions. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [fileId, selectedSubjectIds, selectedSystems, numQuestions, mode, loadQuestions, onStart, session])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#004976', color: '#fff', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Opentomy</div>
        <div style={{ opacity: 0.6, fontSize: 14 }}>Create New Test</div>
      </div>

      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        {/* Mode Toggle */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
            {(['tutor', 'timed'] as QuizMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '10px 32px',
                  background: mode === m ? '#004976' : '#fff',
                  color: mode === m ? '#fff' : '#374151',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: mode === m ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {m === 'tutor' ? 'Tutor' : 'Timed'}
              </button>
            ))}
          </div>
          {mode === 'timed' && (
            <p style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
              Timed mode: {numQuestions * 1.5} min ({numQuestions} questions × 90 sec)
            </p>
          )}
        </section>

        {/* Subjects */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Subjects
            </h2>
            <span style={{ fontSize: 12, color: '#94a3b8', background: '#f1f5f9', padding: '2px 10px', borderRadius: 99 }}>
              {totalQuestions} total questions
            </span>
            <button onClick={selectAllSubjects} style={linkBtnStyle}>All</button>
            <button onClick={clearSubjects} style={linkBtnStyle}>None</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {subjectStats.map(({ subject, questionCount }) => {
              const checked = selectedSubjectIds.includes(subject.id)
              return (
                <label
                  key={subject.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    border: `1px solid ${checked ? '#004976' : '#e2e8f0'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: checked ? '#eff6ff' : '#fff',
                    transition: 'all 0.12s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSubject(subject.id)}
                    style={{ width: 16, height: 16, accentColor: '#004976' }}
                  />
                  <span style={{ flex: 1, fontSize: 14, color: '#1e293b', fontWeight: checked ? 600 : 400 }}>
                    {subject.name}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{questionCount}</span>
                </label>
              )
            })}
          </div>
        </section>

        {/* Systems */}
        {systemStats.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Systems</h2>
              <button onClick={selectAllSystems} style={linkBtnStyle}>All</button>
              <button onClick={clearSystems} style={linkBtnStyle}>None</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {systemStats.map(({ name, questionCount }) => {
                const checked = selectedSystems.includes(name)
                return (
                  <label
                    key={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      border: `1px solid ${checked ? '#004976' : '#e2e8f0'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: checked ? '#eff6ff' : '#fff',
                      transition: 'all 0.12s',
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSystem(name)}
                      style={{ width: 14, height: 14, accentColor: '#004976' }}
                    />
                    <span style={{ flex: 1, color: '#1e293b', fontWeight: checked ? 600 : 400 }}>{name}</span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{questionCount}</span>
                  </label>
                )
              })}
            </div>
          </section>
        )}

        {/* Number of questions */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
            No. of Questions
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              type="number"
              min={1}
              max={40}
              value={numQuestions}
              onChange={e => setNumQuestions(Math.min(40, Math.max(1, Number(e.target.value))))}
              style={{
                width: 80,
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 16,
                fontWeight: 700,
                textAlign: 'center',
                color: '#1e293b',
              }}
            />
            <span style={{ fontSize: 13, color: '#64748b' }}>max 40 per block</span>
          </div>
        </section>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            padding: '14px 48px',
            background: isGenerating ? '#94a3b8' : '#004976',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.05em',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            transition: 'background 0.15s',
          }}
        >
          {isGenerating ? 'LOADING...' : 'GENERATE TEST'}
        </button>
      </div>
    </div>
  )
}

const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  fontSize: 13,
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
}
