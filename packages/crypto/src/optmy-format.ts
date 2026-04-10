/**
 * .optmy binary file format implementation.
 *
 * Binary layout (60-byte fixed prefix):
 *   [0-3]   MAGIC: 0x4F 0x50 0x54 0x4D  ("OPTM")
 *   [4]     VERSION: 0x01
 *   [5]     FLAGS: bit flags (see OptmyFlags in @opentomy/types)
 *   [6-7]   HEADER_LEN: uint16 big-endian, byte length of JSON header
 *   [8-11]  CONTENT_LEN: uint32 big-endian, byte length of ciphertext
 *   [12-27] IV: 16 bytes AES-CBC initialization vector
 *   [28-59] HMAC: 32 bytes HMAC-SHA256 of (IV + ciphertext)
 *   [60 ... 60+HEADER_LEN-1] HEADER: JSON plaintext (UTF-8)
 *   [60+HEADER_LEN ...] CIPHERTEXT: encrypted payload
 */

import { deriveFileKey, deriveActualKey, encrypt, decrypt } from './aes'
import type { EncryptResult } from './aes'

const MAGIC = new Uint8Array([0x4f, 0x50, 0x54, 0x4d])
const FORMAT_VERSION = 0x01
const FIXED_PREFIX_LEN = 60

export class OptmyFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OptmyFormatError'
  }
}

export interface OptmyHeader {
  file_id: string
  creator_user_id: string
  title: string
  description?: string
  question_count: number
  created_at: string
  content_version: number
  thumbnail_url?: string | null
  tags: string[]
  schema_version: string
}

export interface ParsedOptmyFile {
  version: number
  flags: number
  header: OptmyHeader
  iv: Uint8Array
  hmac: Uint8Array
  ciphertext: Uint8Array
}

/** Parse a .optmy buffer. Returns structured data without decrypting. */
export function parseOptmyBuffer(buffer: ArrayBuffer): ParsedOptmyFile {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // Check magic bytes
  for (let i = 0; i < 4; i++) {
    if (bytes[i] !== MAGIC[i]) {
      throw new OptmyFormatError(`Invalid magic bytes at offset ${i}. Not a .optmy file.`)
    }
  }

  const version = view.getUint8(4)
  if (version !== FORMAT_VERSION) {
    throw new OptmyFormatError(`Unsupported .optmy version: ${version}`)
  }

  const flags = view.getUint8(5)
  const headerLen = view.getUint16(6, false) // big-endian
  const contentLen = view.getUint32(8, false) // big-endian
  const iv = bytes.slice(12, 28)
  const hmac = bytes.slice(28, 60)

  const minSize = FIXED_PREFIX_LEN + headerLen + contentLen
  if (buffer.byteLength < minSize) {
    throw new OptmyFormatError(
      `File too short: expected >= ${minSize} bytes, got ${buffer.byteLength}`,
    )
  }

  const headerBytes = bytes.slice(FIXED_PREFIX_LEN, FIXED_PREFIX_LEN + headerLen)
  const headerJson = new TextDecoder().decode(headerBytes)
  let header: OptmyHeader
  try {
    header = JSON.parse(headerJson)
  } catch {
    throw new OptmyFormatError('Failed to parse header JSON')
  }

  const ciphertext = bytes.slice(FIXED_PREFIX_LEN + headerLen, FIXED_PREFIX_LEN + headerLen + contentLen)

  return { version, flags, header, iv, hmac, ciphertext }
}

/** Serialize a .optmy file from header + encrypt result */
export function serializeOptmyBuffer(
  header: OptmyHeader,
  encResult: EncryptResult,
  flags: number,
): ArrayBuffer {
  const headerBytes = new TextEncoder().encode(JSON.stringify(header))
  const totalSize = FIXED_PREFIX_LEN + headerBytes.length + encResult.ciphertext.length
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // Magic
  bytes.set(MAGIC, 0)
  // Version
  view.setUint8(4, FORMAT_VERSION)
  // Flags
  view.setUint8(5, flags)
  // Header length (big-endian uint16)
  view.setUint16(6, headerBytes.length, false)
  // Content length (big-endian uint32)
  view.setUint32(8, encResult.ciphertext.length, false)
  // IV (16 bytes)
  bytes.set(encResult.iv, 12)
  // HMAC (32 bytes)
  bytes.set(encResult.hmac, 28)
  // Header JSON
  bytes.set(headerBytes, FIXED_PREFIX_LEN)
  // Ciphertext
  bytes.set(encResult.ciphertext, FIXED_PREFIX_LEN + headerBytes.length)

  return buffer
}

/**
 * Pack a quiz payload into a .optmy ArrayBuffer.
 * Used by creators when packaging quiz content.
 */
export async function packQuiz(
  masterKey: Uint8Array,
  decryptToken: string,
  payload: object,
  header: OptmyHeader,
  flags: number,
): Promise<ArrayBuffer> {
  const fileKey = await deriveFileKey(masterKey, header.file_id)
  const actualKey = await deriveActualKey(fileKey, decryptToken)
  const plaintext = new TextEncoder().encode(JSON.stringify(payload))
  const encResult = await encrypt(actualKey, plaintext)
  return serializeOptmyBuffer(header, encResult, flags)
}

/**
 * Unpack a .optmy file and return the decrypted quiz payload.
 * Requires the server-issued decrypt_token.
 * Throws OptmyFormatError if the file is malformed or tampered.
 */
export async function unpackQuiz<T = unknown>(
  masterKey: Uint8Array,
  decryptToken: string,
  buffer: ArrayBuffer,
): Promise<{ header: OptmyHeader; payload: T }> {
  const parsed = parseOptmyBuffer(buffer)
  const fileKey = await deriveFileKey(masterKey, parsed.header.file_id)
  const actualKey = await deriveActualKey(fileKey, decryptToken)
  const plaintext = await decrypt(actualKey, parsed.iv, parsed.hmac, parsed.ciphertext)
  const payload = JSON.parse(new TextDecoder().decode(plaintext)) as T
  return { header: parsed.header, payload }
}
