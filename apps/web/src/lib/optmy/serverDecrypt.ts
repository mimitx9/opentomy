import { unpackRaw } from '@opentomy/crypto'
import { createHmac } from 'crypto'

function deriveStableFileToken(serverDecryptSecret: string, fileId: string): string {
  return createHmac('sha256', serverDecryptSecret).update(fileId).digest('hex')
}

function getMasterKey(): Uint8Array {
  const hex = process.env.NEXT_PUBLIC_APP_MASTER_KEY ?? ''
  if (!hex) throw new Error('NEXT_PUBLIC_APP_MASTER_KEY not configured')
  return new Uint8Array((hex.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)))
}

/**
 * Decrypt a .optmy buffer server-side and return the raw SQLite bytes.
 * The file must have content_type='sqlite'.
 */
export async function decryptOptmyToSqlite(buffer: Buffer): Promise<{ sqliteBuffer: Buffer; fileId: string }> {
  const serverSecret = process.env.SERVER_DECRYPT_SECRET ?? ''
  if (!serverSecret) throw new Error('SERVER_DECRYPT_SECRET not configured')

  const masterKey = getMasterKey()
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer

  // Parse header first to get file_id for token derivation
  const { parseOptmyBuffer } = await import('@opentomy/crypto')
  const parsed = parseOptmyBuffer(arrayBuffer)
  const fileId = parsed.header.file_id

  const stableToken = deriveStableFileToken(serverSecret, fileId)
  const { payload } = await unpackRaw(masterKey, stableToken, arrayBuffer)

  return { sqliteBuffer: Buffer.from(payload), fileId }
}
