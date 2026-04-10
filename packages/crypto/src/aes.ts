/**
 * AES-256-CBC encryption + HKDF key derivation.
 * Runs in Node.js (via `crypto` module) and browser (via WebCrypto).
 *
 * Two-layer key derivation:
 *   file_key    = HKDF-SHA256(APP_MASTER_KEY, salt=file_id, info="optmy-file-key")
 *   actual_key  = HKDF-SHA256(file_key, salt=decrypt_token, info="optmy-decrypt")
 */

import { isNode } from './env'

export interface EncryptResult {
  ciphertext: Uint8Array
  iv: Uint8Array
  hmac: Uint8Array
}

// ─── Node.js implementations ────────────────────────────────────────────────

async function hkdfNode(
  key: Uint8Array,
  salt: string,
  info: string,
  length = 32,
): Promise<Uint8Array> {
  const { createHmac, hkdfSync } = await import('crypto')
  const derived = hkdfSync(
    'sha256',
    key,
    Buffer.from(salt, 'utf8'),
    Buffer.from(info, 'utf8'),
    length,
  )
  return new Uint8Array(derived)
}

async function encryptNode(key: Uint8Array, plaintext: Uint8Array): Promise<EncryptResult> {
  const { randomBytes, createCipheriv, createHmac } = await import('crypto')
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(key), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])

  const hmacPayload = Buffer.concat([iv, encrypted])
  const hmac = createHmac('sha256', key).update(hmacPayload).digest()

  return {
    ciphertext: new Uint8Array(encrypted),
    iv: new Uint8Array(iv),
    hmac: new Uint8Array(hmac),
  }
}

async function decryptNode(
  key: Uint8Array,
  iv: Uint8Array,
  hmac: Uint8Array,
  ciphertext: Uint8Array,
): Promise<Uint8Array> {
  const { createDecipheriv, createHmac, timingSafeEqual } = await import('crypto')

  // Verify HMAC before decrypting
  const hmacPayload = Buffer.concat([Buffer.from(iv), Buffer.from(ciphertext)])
  const expectedHmac = createHmac('sha256', key).update(hmacPayload).digest()
  if (!timingSafeEqual(Buffer.from(hmac), expectedHmac)) {
    throw new Error('HMAC verification failed — file may be tampered')
  }

  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()])
  return new Uint8Array(decrypted)
}

// ─── Browser (WebCrypto) implementations ────────────────────────────────────

async function hkdfBrowser(
  key: Uint8Array,
  salt: string,
  info: string,
  length = 32,
): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey('raw', key, 'HKDF', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(salt),
      info: new TextEncoder().encode(info),
    },
    baseKey,
    length * 8,
  )
  return new Uint8Array(derived)
}

async function encryptBrowser(key: Uint8Array, plaintext: Uint8Array): Promise<EncryptResult> {
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const aesKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, aesKey, plaintext)

  const ciphertext = new Uint8Array(encrypted)

  // HMAC
  const hmacKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const hmacPayload = new Uint8Array(iv.length + ciphertext.length)
  hmacPayload.set(iv, 0)
  hmacPayload.set(ciphertext, iv.length)
  const hmacBuf = await crypto.subtle.sign('HMAC', hmacKey, hmacPayload)

  return { ciphertext, iv, hmac: new Uint8Array(hmacBuf) }
}

async function decryptBrowser(
  key: Uint8Array,
  iv: Uint8Array,
  hmac: Uint8Array,
  ciphertext: Uint8Array,
): Promise<Uint8Array> {
  // Verify HMAC
  const hmacKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
  )
  const hmacPayload = new Uint8Array(iv.length + ciphertext.length)
  hmacPayload.set(iv, 0)
  hmacPayload.set(ciphertext, iv.length)
  const valid = await crypto.subtle.verify('HMAC', hmacKey, hmac, hmacPayload)
  if (!valid) throw new Error('HMAC verification failed — file may be tampered')

  const aesKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['decrypt'])
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, aesKey, ciphertext)
  return new Uint8Array(decrypted)
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Derive file_key from APP_MASTER_KEY and file_id */
export async function deriveFileKey(masterKey: Uint8Array, fileId: string): Promise<Uint8Array> {
  return isNode
    ? hkdfNode(masterKey, fileId, 'optmy-file-key')
    : hkdfBrowser(masterKey, fileId, 'optmy-file-key')
}

/** Derive the final AES key from file_key and server-issued decrypt_token */
export async function deriveActualKey(
  fileKey: Uint8Array,
  decryptToken: string,
): Promise<Uint8Array> {
  return isNode
    ? hkdfNode(fileKey, decryptToken, 'optmy-decrypt')
    : hkdfBrowser(fileKey, decryptToken, 'optmy-decrypt')
}

/** Encrypt plaintext with the derived key */
export async function encrypt(key: Uint8Array, plaintext: Uint8Array): Promise<EncryptResult> {
  return isNode ? encryptNode(key, plaintext) : encryptBrowser(key, plaintext)
}

/** Decrypt and verify integrity */
export async function decrypt(
  key: Uint8Array,
  iv: Uint8Array,
  hmac: Uint8Array,
  ciphertext: Uint8Array,
): Promise<Uint8Array> {
  return isNode
    ? decryptNode(key, iv, hmac, ciphertext)
    : decryptBrowser(key, iv, hmac, ciphertext)
}
