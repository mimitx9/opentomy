import initSqlJs from 'sql.js'
import type {
  DbCert,
  DbExam,
  DbPlan,
  DbQuestion,
  DbAnswer,
  DbQuestionProfile,
} from './mysql.js'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS file_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id          INTEGER PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exams (
  id          INTEGER PRIMARY KEY,
  subject_id  INTEGER NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_sets (
  id              INTEGER PRIMARY KEY,
  exam_id         INTEGER NOT NULL,
  code            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questions (
  id          INTEGER PRIMARY KEY,
  quiz_set_id INTEGER NOT NULL,
  type        TEXT NOT NULL DEFAULT 'multiple_choice',
  stem        TEXT NOT NULL,
  image_url   TEXT,
  difficulty  INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS answers (
  id          INTEGER PRIMARY KEY,
  question_id INTEGER NOT NULL,
  text        TEXT NOT NULL,
  is_correct  INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS question_profiles (
  id             INTEGER PRIMARY KEY,
  question_id    INTEGER NOT NULL,
  attribute_type TEXT NOT NULL,
  value          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exams_subject    ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sets_exam   ON quiz_sets(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_qs     ON questions(quiz_set_id);
CREATE INDEX IF NOT EXISTS idx_answers_q        ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_profiles_q       ON question_profiles(question_id);
`

export interface BuildInput {
  title: string
  certs: DbCert[]
  examsByCert: Map<string, DbExam[]>
  plansByExam: Map<string, DbPlan[]>
  questionsByPlan: Map<number, DbQuestion[]>
  answersByQuestion: Map<number, DbAnswer[]>
  profilesByQuestion: Map<number, DbQuestionProfile[]>
}

export async function buildSqliteBuffer(input: BuildInput): Promise<Buffer> {
  const SQL = await initSqlJs()
  const db = new SQL.Database()

  db.run(SCHEMA)

  db.run(`INSERT INTO file_meta VALUES ('title', ?)`, [input.title])
  db.run(`INSERT INTO file_meta VALUES ('generated_at', ?)`, [new Date().toISOString()])
  db.run(`INSERT INTO file_meta VALUES ('schema_version', '1')`)

  let certOrder = 0
  for (const cert of input.certs) {
    db.run(`INSERT OR IGNORE INTO subjects VALUES (?, ?, ?, ?)`, [
      cert.id, cert.code, cert.name, certOrder++,
    ])

    const exams = input.examsByCert.get(cert.code) ?? []
    let examOrder = 0
    for (const exam of exams) {
      db.run(`INSERT OR IGNORE INTO exams VALUES (?, ?, ?, ?, ?)`, [
        exam.id, cert.id, exam.code, exam.name, examOrder++,
      ])

      const plans = input.plansByExam.get(exam.code) ?? []
      let planOrder = 0
      for (const plan of plans) {
        const questions = input.questionsByPlan.get(plan.id) ?? []
        db.run(`INSERT OR IGNORE INTO quiz_sets VALUES (?, ?, ?, ?, ?, ?)`, [
          plan.id, exam.id, plan.code, plan.name, questions.length, planOrder++,
        ])

        let qOrder = 0
        for (const q of questions) {
          db.run(`INSERT OR IGNORE INTO questions VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            q.id, plan.id, mapQuestionType(q.type), q.stem ?? '', q.image_url ?? null, 0, qOrder++,
          ])

          const answers = input.answersByQuestion.get(q.id) ?? []
          for (const a of answers) {
            db.run(`INSERT OR IGNORE INTO answers VALUES (?, ?, ?, ?, ?, ?, ?)`, [
              a.id, q.id, a.text ?? '', a.is_correct ? 1 : 0,
              a.explanation ?? null, a.image_url ?? null, a.sort_order,
            ])
          }

          const profiles = input.profilesByQuestion.get(q.id) ?? []
          for (const p of profiles) {
            db.run(`INSERT INTO question_profiles (question_id, attribute_type, value) VALUES (?, ?, ?)`, [
              q.id, p.attribute_type, p.value,
            ])
          }
        }
      }
    }
  }

  const exported = db.export()
  db.close()
  return Buffer.from(exported)
}

function mapQuestionType(raw: string): string {
  if (!raw || raw === 'AMB') return 'multiple_choice'
  return raw.toLowerCase().replace(/\s+/g, '_')
}
