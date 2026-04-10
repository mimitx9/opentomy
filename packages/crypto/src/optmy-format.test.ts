import { describe, it, expect } from 'vitest'
import { packQuiz, unpackQuiz, parseOptmyBuffer, OptmyFormatError } from './optmy-format'
import { generateDecryptToken } from './token'

const TEST_MASTER_KEY = new Uint8Array(32).fill(0xab)
const TEST_SERVER_SECRET = 'test-server-secret'
const TEST_FILE_ID = 'test-file-123'
const TEST_USER_ID = 'test-user-456'

const sampleHeader = {
  file_id: TEST_FILE_ID,
  creator_user_id: TEST_USER_ID,
  title: 'Test Quiz',
  question_count: 1,
  created_at: new Date().toISOString(),
  content_version: 1,
  tags: ['test'],
  schema_version: '1.0',
}

const samplePayload = {
  id: TEST_FILE_ID,
  title: 'Test Quiz',
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice',
      stem: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correct_index: 1,
      points: 1,
      order: 0,
    },
  ],
  settings: {
    shuffle_questions: false,
    shuffle_options: false,
    show_explanations: true,
    time_limit_seconds: null,
    max_attempts: null,
    pass_score_percent: null,
  },
}

describe('packQuiz / unpackQuiz round-trip', () => {
  it('encrypts and decrypts correctly', async () => {
    const { token } = await generateDecryptToken(TEST_SERVER_SECRET, TEST_FILE_ID, TEST_USER_ID)
    const buffer = await packQuiz(TEST_MASTER_KEY, token, samplePayload, sampleHeader, 0b111)
    const { header, payload } = await unpackQuiz(TEST_MASTER_KEY, token, buffer)

    expect(header.file_id).toBe(TEST_FILE_ID)
    expect(header.title).toBe('Test Quiz')
    expect((payload as typeof samplePayload).questions[0].correct_index).toBe(1)
  })
})

describe('parseOptmyBuffer', () => {
  it('returns plaintext header without decrypting', async () => {
    const { token } = await generateDecryptToken(TEST_SERVER_SECRET, TEST_FILE_ID, TEST_USER_ID)
    const buffer = await packQuiz(TEST_MASTER_KEY, token, samplePayload, sampleHeader, 0b111)
    const parsed = parseOptmyBuffer(buffer)

    expect(parsed.header.title).toBe('Test Quiz')
    expect(parsed.header.question_count).toBe(1)
    expect(parsed.flags).toBe(0b111)
    expect(parsed.version).toBe(1)
  })

  it('throws OptmyFormatError for invalid magic bytes', () => {
    const bad = new ArrayBuffer(100)
    expect(() => parseOptmyBuffer(bad)).toThrow(OptmyFormatError)
  })
})
