import path from 'path'
import fs from 'fs'
import type { PrismaClient } from '@opentomy/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlJsDb = any

async function openSqliteDb(buffer: Buffer): Promise<SqlJsDb> {
  const initSqlJs = (await import('sql.js')).default
  const wasmPath = path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm')
  const wasmBuffer = fs.readFileSync(wasmPath)
  const wasmBinary = wasmBuffer.buffer.slice(wasmBuffer.byteOffset, wasmBuffer.byteOffset + wasmBuffer.byteLength) as ArrayBuffer
  const SQL = await initSqlJs({ wasmBinary })
  const arr = new Uint8Array(buffer.byteLength)
  buffer.copy(arr)
  return new SQL.Database(arr)
}

function rows<T>(db: SqlJsDb, sql: string): T[] {
  const result = db.exec(sql)
  if (!result.length) return []
  const { columns, values } = result[0]
  return values.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col: string, i: number) => { obj[col] = row[i] })
    return obj as T
  })
}

interface SqlSubject { id: number; code: string; name: string; sort_order: number }
interface SqlExam { id: number; subject_id: number; code: string; name: string; sort_order: number }
interface SqlQuizSet { id: number; exam_id: number; code: string; name: string; total_questions: number; sort_order: number }
interface SqlQuestion { id: number; quiz_set_id: number; type: string; stem: string; image_url: string | null; difficulty: number; sort_order: number }
interface SqlAnswer { id: number; question_id: number; text: string; is_correct: number; explanation: string | null; image_url: string | null; sort_order: number }
interface SqlProfile { id: number; question_id: number; attribute_type: string; value: string }

const BATCH = 500

async function insertBatched<T>(
  items: T[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (batch: T[]) => Promise<any>,
): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH) {
    await fn(items.slice(i, i + BATCH))
  }
}

/**
 * Import all content from a decrypted SQLite buffer into MySQL.
 * Runs inside a Prisma transaction for atomicity.
 * Returns total question count imported.
 */
export async function importSqliteToMysql(
  sqliteBuffer: Buffer,
  fileId: string,
  prisma: PrismaClient,
): Promise<{ questionCount: number }> {
  const db = await openSqliteDb(sqliteBuffer)

  const sqlSubjects = rows<SqlSubject>(db, 'SELECT * FROM subjects ORDER BY sort_order')
  const sqlExams = rows<SqlExam>(db, 'SELECT * FROM exams ORDER BY sort_order')
  const sqlQuizSets = rows<SqlQuizSet>(db, 'SELECT * FROM quiz_sets ORDER BY sort_order')
  const sqlQuestions = rows<SqlQuestion>(db, 'SELECT * FROM questions ORDER BY sort_order')
  const sqlAnswers = rows<SqlAnswer>(db, 'SELECT * FROM answers ORDER BY sort_order')
  const sqlProfiles = rows<SqlProfile>(db, 'SELECT * FROM question_profiles')
  db.close()

  // Maps from SQLite integer ID → MySQL auto-increment ID
  const subjectIdMap = new Map<number, number>()
  const examIdMap = new Map<number, number>()
  const quizSetIdMap = new Map<number, number>()
  const questionIdMap = new Map<number, number>()

  await prisma.$transaction(async (tx) => {
    // Insert subjects one-by-one to capture MySQL IDs
    for (const s of sqlSubjects) {
      const created = await tx.subject.create({
        data: { fileId, code: s.code, name: s.name, sortOrder: s.sort_order },
      })
      subjectIdMap.set(s.id, created.id)
    }

    for (const e of sqlExams) {
      const mysqlSubjectId = subjectIdMap.get(e.subject_id)
      if (!mysqlSubjectId) continue
      const created = await tx.exam.create({
        data: { subjectId: mysqlSubjectId, code: e.code, name: e.name, sortOrder: e.sort_order },
      })
      examIdMap.set(e.id, created.id)
    }

    for (const qs of sqlQuizSets) {
      const mysqlExamId = examIdMap.get(qs.exam_id)
      if (!mysqlExamId) continue
      const created = await tx.quizSet.create({
        data: {
          examId: mysqlExamId,
          code: qs.code,
          name: qs.name,
          totalQuestions: qs.total_questions,
          sortOrder: qs.sort_order,
        },
      })
      quizSetIdMap.set(qs.id, created.id)
    }

    for (const q of sqlQuestions) {
      const mysqlQuizSetId = quizSetIdMap.get(q.quiz_set_id)
      if (!mysqlQuizSetId) continue
      const created = await tx.question.create({
        data: {
          quizSetId: mysqlQuizSetId,
          type: q.type ?? 'multiple_choice',
          stem: q.stem,
          imageUrl: q.image_url ?? null,
          difficulty: q.difficulty ?? 0,
          sortOrder: q.sort_order ?? 0,
        },
      })
      questionIdMap.set(q.id, created.id)
    }

    // Batch insert answers
    const answerData = sqlAnswers
      .filter(a => questionIdMap.has(a.question_id))
      .map(a => ({
        questionId: questionIdMap.get(a.question_id)!,
        text: a.text,
        isCorrect: a.is_correct === 1,
        explanation: a.explanation ?? null,
        imageUrl: a.image_url ?? null,
        sortOrder: a.sort_order ?? 0,
      }))

    await insertBatched(answerData, batch =>
      tx.answer.createMany({ data: batch }),
    )

    // Batch insert profiles
    const profileData = sqlProfiles
      .filter(p => questionIdMap.has(p.question_id))
      .map(p => ({
        questionId: questionIdMap.get(p.question_id)!,
        attributeType: p.attribute_type,
        value: p.value,
      }))

    await insertBatched(profileData, batch =>
      tx.questionProfile.createMany({ data: batch }),
    )
  }, { timeout: 120000 })

  return { questionCount: sqlQuestions.length }
}
