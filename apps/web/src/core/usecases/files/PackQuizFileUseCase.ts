import { randomUUID } from 'crypto'
import { createHmac } from 'crypto'
import { packQuiz } from '@opentomy/crypto'
import type { OptmyHeader } from '@opentomy/crypto'
import type { QuizPayload } from '@opentomy/types'
import type { IFileRepository } from '../../ports/outbound/repositories/IFileRepository'
import type { IFileStoragePort } from '../../ports/outbound/IFileStoragePort'

export interface PackQuizFileInput {
  creatorId: string
  title: string
  description?: string
  tags?: string[]
  thumbnailUrl?: string | null
  questions: QuizPayload['questions']
  settings: QuizPayload['settings']
}

export interface PackQuizFileOutput {
  fileId: string
}

/**
 * Derive a stable, file-level decrypt token.
 * Formula: HMAC-SHA256(SERVER_DECRYPT_SECRET, fileId)
 *
 * Why stable (not user+expiry based)?
 *   - The .optmy file is packed ONCE and served to many users.
 *   - The final AES key is: HKDF(HKDF(APP_MASTER_KEY, fileId), stableToken)
 *   - Access control is enforced by IssueDecryptTokenUseCase (before returning this same token).
 *   - Without SERVER_DECRYPT_SECRET you cannot derive the token even knowing APP_MASTER_KEY.
 */
export function deriveStableFileToken(serverDecryptSecret: string, fileId: string): string {
  return createHmac('sha256', serverDecryptSecret).update(fileId).digest('hex')
}

export class PackQuizFileUseCase {
  constructor(
    private readonly fileRepo: IFileRepository,
    private readonly fileStorage: IFileStoragePort,
  ) {}

  async execute(input: PackQuizFileInput): Promise<PackQuizFileOutput> {
    const masterKeyHex = process.env.NEXT_PUBLIC_APP_MASTER_KEY ?? ''
    const serverSecret = process.env.SERVER_DECRYPT_SECRET ?? ''

    if (!masterKeyHex || !serverSecret) {
      throw new Error('APP_MASTER_KEY or SERVER_DECRYPT_SECRET not configured')
    }

    // Convert hex master key to Uint8Array
    const masterKey = new Uint8Array(
      (masterKeyHex.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)),
    )

    const fileId = randomUUID()
    const now = new Date().toISOString()
    const stableToken = deriveStableFileToken(serverSecret, fileId)

    const payload: QuizPayload = {
      id: fileId,
      title: input.title,
      description: input.description,
      questions: input.questions,
      settings: input.settings,
    }

    const header: OptmyHeader = {
      file_id: fileId,
      creator_user_id: input.creatorId,
      title: input.title,
      description: input.description,
      question_count: input.questions.length,
      created_at: now,
      content_version: 1,
      thumbnail_url: input.thumbnailUrl ?? null,
      tags: input.tags ?? [],
      schema_version: '1.0',
    }

    // Pack → encrypted binary
    const buffer = await packQuiz(masterKey, stableToken, payload, header, 0b111)
    const fileKey = `quizzes/${fileId}.optmy`

    // Upload to GCS
    await this.fileStorage.upload(fileKey, Buffer.from(buffer))

    // Save metadata to DB
    await this.fileRepo.create({
      id: fileId,
      creatorId: input.creatorId,
      title: input.title,
      description: input.description,
      questionCount: input.questions.length,
      tags: input.tags ?? [],
      thumbnailUrl: input.thumbnailUrl ?? null,
      fileKey,
      fileSize: buffer.byteLength,
      contentVersion: 1,
      isPublic: true,
    })

    return { fileId }
  }
}
