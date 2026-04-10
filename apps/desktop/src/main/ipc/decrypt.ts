/**
 * Decrypt IPC handler — runs entirely in main process.
 * The APP_MASTER_KEY never leaves this process.
 * The renderer only receives the final decrypted JSON.
 */
import { ipcMain } from 'electron'
import { unpackQuiz } from '@opentomy/crypto'

function getMasterKey(): Uint8Array {
  const hex = process.env.APP_MASTER_KEY ?? ''
  const bytes = hex.match(/.{2}/g)?.map(b => parseInt(b, 16)) ?? []
  if (bytes.length !== 32) {
    throw new Error('APP_MASTER_KEY must be a 64-character hex string (32 bytes)')
  }
  return new Uint8Array(bytes)
}

export function registerDecryptIPC() {
  ipcMain.handle(
    'decrypt:execute',
    async (_event, fileBase64: string, decryptToken: string) => {
      const masterKey = getMasterKey()
      const buffer = Buffer.from(fileBase64, 'base64')
      const { header, payload } = await unpackQuiz(masterKey, decryptToken, buffer.buffer)
      // Return only what the renderer needs — never return masterKey or decryptToken
      return { header, payload }
    },
  )
}
