import type {
  DbSubject,
  DbQuestion,
  DbAnswer,
  DbQuestionProfile,
  QuizQuestion,
  SubjectStat,
  SystemStat,
} from '@/types/quizSession'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlJsDatabase = any

let _initSqlJs: (() => Promise<SqlJsDatabase>) | null = null

async function getSqlJs() {
  if (!_initSqlJs) {
    const sqljs = await import('sql.js')
    const initFn = sqljs.default ?? sqljs
    _initSqlJs = () =>
      initFn({ locateFile: () => '/sql-wasm.wasm' })
  }
  return _initSqlJs()
}

export async function loadDatabase(buffer: ArrayBuffer): Promise<SqlJsDatabase> {
  const SQL = await getSqlJs()
  return new SQL.Database(new Uint8Array(buffer))
}

function rows<T>(db: SqlJsDatabase, sql: string, params: unknown[] = []): T[] {
  const result = db.exec(sql, params)
  if (!result.length) return []
  const { columns, values } = result[0]
  return values.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col: string, i: number) => { obj[col] = row[i] })
    return obj as T
  })
}

export function getSubjects(db: SqlJsDatabase): DbSubject[] {
  return rows<DbSubject>(db, 'SELECT * FROM subjects ORDER BY sort_order, name')
}

export function getSubjectStats(db: SqlJsDatabase): SubjectStat[] {
  const subjects = getSubjects(db)
  return subjects.map(subject => {
    const result = db.exec(
      `SELECT COUNT(*) as c FROM questions q
       JOIN quiz_sets qs ON q.quiz_set_id = qs.id
       JOIN exams e ON qs.exam_id = e.id
       WHERE e.subject_id = ?`,
      [subject.id],
    )
    const count = result[0]?.values[0]?.[0] ?? 0
    return { subject, questionCount: Number(count) }
  })
}

export function getSystemStats(db: SqlJsDatabase): SystemStat[] {
  const result = rows<{ value: string; c: number }>(
    db,
    `SELECT qp.value, COUNT(DISTINCT qp.question_id) as c
     FROM question_profiles qp
     WHERE qp.attribute_type = 'SYSTEM'
     GROUP BY qp.value
     ORDER BY qp.value`,
  )
  return result.map(r => ({ name: r.value, questionCount: Number(r.c) }))
}

export function getTotalQuestions(db: SqlJsDatabase): number {
  const result = db.exec('SELECT COUNT(*) FROM questions')
  return Number(result[0]?.values[0]?.[0] ?? 0)
}

export interface QueryOptions {
  subjectIds?: number[]
  systems?: string[]
  limit?: number
  shuffle?: boolean
}

export function queryQuestions(db: SqlJsDatabase, opts: QueryOptions = {}): QuizQuestion[] {
  const { subjectIds, systems, limit = 40, shuffle = true } = opts

  let sql = `
    SELECT DISTINCT q.id, q.stem, q.image_url, q.difficulty
    FROM questions q
    JOIN quiz_sets qs ON q.quiz_set_id = qs.id
    JOIN exams e ON qs.exam_id = e.id
  `
  const params: unknown[] = []

  if (systems && systems.length > 0) {
    sql += ` JOIN question_profiles qp ON qp.question_id = q.id AND qp.attribute_type = 'SYSTEM'`
  }

  const conditions: string[] = []

  if (subjectIds && subjectIds.length > 0) {
    conditions.push(`e.subject_id IN (${subjectIds.map(() => '?').join(',')})`)
    params.push(...subjectIds)
  }

  if (systems && systems.length > 0) {
    conditions.push(`qp.value IN (${systems.map(() => '?').join(',')})`)
    params.push(...systems)
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`
  }

  if (shuffle) {
    sql += ' ORDER BY RANDOM()'
  } else {
    sql += ' ORDER BY q.sort_order'
  }

  sql += ` LIMIT ${limit}`

  const dbQuestions = rows<DbQuestion>(db, sql, params)
  if (!dbQuestions.length) return []

  const questionIds = dbQuestions.map(q => q.id)
  const answers = getAnswersForQuestions(db, questionIds)
  const profiles = getProfilesForQuestions(db, questionIds)

  return dbQuestions.map(q => {
    const qAnswers = answers
      .filter(a => a.question_id === q.id)
      .map(a => ({
        id: a.id,
        text: a.text,
        is_correct: a.is_correct === 1,
        explanation: a.explanation ?? undefined,
        image_url: a.image_url ?? undefined,
      }))

    const systemProfile = profiles.find(
      p => p.question_id === q.id && p.attribute_type === 'SYSTEM',
    )
    const subjectProfile = profiles.find(
      p => p.question_id === q.id && p.attribute_type === 'SUBJECT',
    )

    return {
      id: q.id,
      stem: q.stem,
      image_url: q.image_url ?? undefined,
      answers: qAnswers,
      system: systemProfile?.value,
      subject: subjectProfile?.value,
    }
  })
}

function getAnswersForQuestions(db: SqlJsDatabase, questionIds: number[]): DbAnswer[] {
  if (!questionIds.length) return []
  const placeholders = questionIds.map(() => '?').join(',')
  return rows<DbAnswer>(
    db,
    `SELECT * FROM answers WHERE question_id IN (${placeholders}) ORDER BY sort_order`,
    questionIds,
  )
}

function getProfilesForQuestions(db: SqlJsDatabase, questionIds: number[]): DbQuestionProfile[] {
  if (!questionIds.length) return []
  const placeholders = questionIds.map(() => '?').join(',')
  return rows<DbQuestionProfile>(
    db,
    `SELECT * FROM question_profiles WHERE question_id IN (${placeholders})`,
    questionIds,
  )
}
