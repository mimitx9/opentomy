import mysql from 'mysql2/promise'

export interface DbCert {
  id: number
  code: string
  name: string
}

export interface DbExam {
  id: number
  code: string
  name: string
  parent_code: string
}

export interface DbPlan {
  id: number
  code: string
  name: string
  parent_code: string
}

export interface DbQuestion {
  id: number
  stem: string
  type: string
  image_url: string | null
}

export interface DbAnswer {
  id: number
  question_id: number
  text: string
  is_correct: boolean
  explanation: string | null
  image_url: string | null
  sort_order: number
}

export interface DbQuestionProfile {
  question_id: number
  attribute_type: string
  value: string
}

export async function createConnection() {
  return mysql.createConnection({
    host: process.env.FAMASTER_DB_HOST ?? 'localhost',
    port: Number(process.env.FAMASTER_DB_PORT ?? 3306),
    database: process.env.FAMASTER_DB_NAME ?? 'famaster',
    user: process.env.FAMASTER_DB_USER ?? 'root',
    password: process.env.FAMASTER_DB_PASS ?? '',
    charset: 'utf8mb4',
  })
}

export async function fetchCerts(conn: mysql.Connection, certCode?: string): Promise<DbCert[]> {
  const where = certCode ? 'AND code = ?' : ''
  const params = certCode ? ['CERT', certCode] : ['CERT']
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id, code, name FROM masters WHERE type = ? ${where} ORDER BY id`,
    params,
  )
  return rows as DbCert[]
}

export async function fetchExams(conn: mysql.Connection, certCode: string): Promise<DbExam[]> {
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id, code, name, parent_code FROM masters WHERE type = 'EXAM' AND parent_code = ? ORDER BY id`,
    [certCode],
  )
  return rows as DbExam[]
}

export async function fetchPlans(conn: mysql.Connection, examCode: string): Promise<DbPlan[]> {
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id, code, name, parent_code FROM masters WHERE type = 'PLAN' AND parent_code = ? ORDER BY id`,
    [examCode],
  )
  return rows as DbPlan[]
}

export async function fetchQuestionsForPlan(
  conn: mysql.Connection,
  planId: number,
): Promise<DbQuestion[]> {
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT q.id, q.question_stem AS stem, q.type, NULL AS image_url
     FROM masters_questions mq
     JOIN questions q ON q.id = mq.question_id
     WHERE mq.master_id = ?
     ORDER BY mq.id`,
    [planId],
  )
  return rows as DbQuestion[]
}

export async function fetchAnswersForQuestions(
  conn: mysql.Connection,
  questionIds: number[],
): Promise<DbAnswer[]> {
  if (questionIds.length === 0) return []
  const placeholders = questionIds.map(() => '?').join(',')
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT a.id, a.question_id,
            COALESCE(a.text_raw, a.text_format, '') AS text,
            (a.status = 'CORRECT') AS is_correct,
            NULL AS explanation,
            NULL AS image_url,
            ROW_NUMBER() OVER (PARTITION BY a.question_id ORDER BY a.id) - 1 AS sort_order
     FROM answers a
     WHERE a.question_id IN (${placeholders})
     ORDER BY a.question_id, a.id`,
    questionIds,
  )
  return rows as DbAnswer[]
}

export async function fetchProfilesForQuestions(
  conn: mysql.Connection,
  questionIds: number[],
): Promise<DbQuestionProfile[]> {
  if (questionIds.length === 0) return []
  const placeholders = questionIds.map(() => '?').join(',')
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT object_id AS question_id, attribute_type, attribute_value_raw AS value
     FROM quiz_profiles
     WHERE object_type = 'Q' AND object_id IN (${placeholders})
     ORDER BY object_id, attribute_type`,
    questionIds,
  )
  return rows as DbQuestionProfile[]
}
