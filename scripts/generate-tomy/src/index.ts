import dotenv from 'dotenv'
import path from 'node:path'
// Load generate-tomy .env first, then merge prod env for GCS keys
dotenv.config()
dotenv.config({ path: path.resolve(__dirname, '../../../.env.production'), override: false })
import fs from 'node:fs'
import { createHmac } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { Storage } from '@google-cloud/storage'
import { packRaw } from '../../../packages/crypto/src/index'
import type { OptmyHeader } from '../../../packages/crypto/src/index'
import {
  createConnection,
  fetchCerts,
  fetchExams,
  fetchPlans,
  fetchQuestionsForPlan,
  fetchAnswersForQuestions,
  fetchProfilesForQuestions,
} from './mysql'
import { buildSqliteBuffer } from './builder'
import type { DbAnswer, DbQuestion, DbQuestionProfile } from './mysql'

// ── Env validation ────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing env var: ${name}`)
  return val
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string')
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function deriveStableToken(secret: string, fileId: string): string {
  return createHmac('sha256', secret).update(fileId).digest('hex')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const certCode = args.find((a) => !a.startsWith('--'))

  const masterKey = hexToBytes(requireEnv('APP_MASTER_KEY'))
  const serverSecret = requireEnv('SERVER_DECRYPT_SECRET')
  const outputDir = process.env.OUTPUT_DIR ?? './output'
  fs.mkdirSync(outputDir, { recursive: true })

  console.log('Connecting to famaster DB...')
  const conn = await createConnection()

  try {
    console.log(`Fetching certs${certCode ? ` (filter: ${certCode})` : ''}...`)
    const certs = await fetchCerts(conn, certCode)
    if (certs.length === 0) {
      console.error('No certs found. Check your DB connection or --cert filter.')
      process.exit(1)
    }

    // ── Fetch full hierarchy ─────────────────────────────────────────────────
    const examsByCert = new Map<string, Awaited<ReturnType<typeof fetchExams>>>()
    const plansByExam = new Map<string, Awaited<ReturnType<typeof fetchPlans>>>()
    const questionsByPlan = new Map<number, DbQuestion[]>()
    const answersByQuestion = new Map<number, DbAnswer[]>()
    const profilesByQuestion = new Map<number, DbQuestionProfile[]>()

    for (const cert of certs) {
      const exams = await fetchExams(conn, cert.code)
      examsByCert.set(cert.code, exams)
      console.log(`  ${cert.code}: ${exams.length} exams`)

      for (const exam of exams) {
        const plans = await fetchPlans(conn, exam.code)
        plansByExam.set(exam.code, plans)

        for (const plan of plans) {
          const questions = await fetchQuestionsForPlan(conn, plan.id)
          questionsByPlan.set(plan.id, questions)

          if (questions.length === 0) continue

          const qIds = questions.map((q) => q.id)

          const answers = await fetchAnswersForQuestions(conn, qIds)
          const profiles = await fetchProfilesForQuestions(conn, qIds)

          for (const q of questions) {
            answersByQuestion.set(
              q.id,
              answers.filter((a) => a.question_id === q.id),
            )
            profilesByQuestion.set(
              q.id,
              profiles.filter((p) => p.question_id === q.id),
            )
          }
        }
      }
    }

    // ── Generate one .tomy file per cert ─────────────────────────────────────
    for (const cert of certs) {
      const fileId = uuidv4()
      const decryptToken = deriveStableToken(serverSecret, fileId)

      const title = cert.name
      const certExams = examsByCert.get(cert.code) ?? []
      const certPlanIds = certExams.flatMap((e) => (plansByExam.get(e.code) ?? []).map((p) => p.id))
      const totalQuestions = certPlanIds.reduce(
        (sum, pid) => sum + (questionsByPlan.get(pid)?.length ?? 0),
        0,
      )

      console.log(`\nBuilding SQLite for "${title}" (${totalQuestions} questions)...`)

      const sqliteBuffer = await buildSqliteBuffer({
        title,
        certs: [cert],
        examsByCert,
        plansByExam,
        questionsByPlan,
        answersByQuestion,
        profilesByQuestion,
      })

      const header: OptmyHeader = {
        file_id: fileId,
        creator_user_id: 'generate-tomy-script',
        title,
        description: `Generated from famaster. Cert: ${cert.code}`,
        question_count: totalQuestions,
        created_at: new Date().toISOString(),
        content_version: 1,
        tags: [cert.code],
        schema_version: '1.0',
        content_type: 'sqlite',
      }

      console.log(`Encrypting (fileId: ${fileId})...`)
      const buffer = await packRaw(
        masterKey,
        decryptToken,
        new Uint8Array(sqliteBuffer),
        header,
        0b111,
      )

      const filename = `${cert.code.toLowerCase()}.tomy`
      const outPath = path.join(outputDir, filename)
      const outBuffer = Buffer.from(buffer)
      fs.writeFileSync(outPath, outBuffer)

      const sizeMb = (buffer.byteLength / 1024 / 1024).toFixed(2)
      console.log(`✓ ${outPath} (${sizeMb} MB)`)
      console.log(`  file_id:       ${fileId}`)
      console.log(`  decrypt_token: ${decryptToken}`)

      // Direct GCS upload (bypasses Vercel payload limit)
      const gcsKeyB64 = process.env.GCS_KEY_BASE64
      if (gcsKeyB64) {
        console.log(`  Uploading to GCS...`)
        const rawJson = Buffer.from(gcsKeyB64.trim(), 'base64').toString('utf-8').trim()
        let credentials: Record<string, unknown>
        try {
          credentials = JSON.parse(rawJson)
        } catch {
          credentials = JSON.parse(rawJson.replace(/[\r\n]/g, '\\n'))
        }
        const storage = new Storage({ credentials })
        const bucket = (process.env.GCS_BUCKET ?? 'faquiz2').trim()
        const prefix = (process.env.GCS_FILE_PREFIX ?? 'opentomy/').trim()
        const gcsKey = `${prefix.replace(/\/$/, '')}/quizzes/${fileId}.optmy`
        await storage.bucket(bucket).file(gcsKey).save(outBuffer, {
          contentType: 'application/octet-stream',
          resumable: false,
        })
        console.log(`  ✓ GCS: gs://${bucket}/${gcsKey}`)
      }
    }
  } finally {
    await conn.end()
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
