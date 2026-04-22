import { Storage } from '@google-cloud/storage'
import type { IFileStoragePort } from '../../core/ports/outbound/IFileStoragePort'

/**
 * Google Cloud Storage adapter implementing IFileStoragePort.
 *
 * Config (all via .env — no hardcoded credentials):
 *   GCS_KEY_BASE64        — base64-encoded service account JSON
 *   GCS_BUCKET            — bucket name (e.g. faquiz2)
 *   GCS_FILE_PREFIX       — path prefix inside the bucket (e.g. opentomy/)
 *   GCS_PUBLIC_BASE_URL   — optional: if set, getDownloadUrl returns a direct public URL
 *                           instead of a signed URL. Set when bucket is public.
 *                           e.g. https://storage.googleapis.com/faquiz2
 */
export class GCSFileStorageAdapter implements IFileStoragePort {
  private readonly storage: Storage
  private readonly bucket: string
  private readonly prefix: string
  private readonly publicBaseUrl: string | null

  constructor() {
    const keyBase64 = process.env.GCS_KEY_BASE64
    if (!keyBase64) {
      throw new Error('GCS_KEY_BASE64 environment variable is not set')
    }

    const credentials = JSON.parse(
      Buffer.from(keyBase64, 'base64').toString('utf-8'),
    )

    this.storage = new Storage({ credentials })
    this.bucket = process.env.GCS_BUCKET ?? 'faquiz2'
    // Ensure prefix ends with "/" if non-empty
    const rawPrefix = (process.env.GCS_FILE_PREFIX ?? 'opentomy/').trim()
    this.prefix = rawPrefix.endsWith('/') ? rawPrefix : `${rawPrefix}/`
    this.publicBaseUrl = process.env.GCS_PUBLIC_BASE_URL ?? null
  }

  /** Full GCS object name: prefix + caller-provided key */
  private objectName(key: string): string {
    return `${this.prefix}${key}`
  }

  async upload(key: string, buffer: Buffer): Promise<void> {
    const file = this.storage.bucket(this.bucket).file(this.objectName(key))
    await file.save(buffer, {
      contentType: 'application/octet-stream',
      resumable: false,
    })
  }

  async getBuffer(key: string): Promise<Buffer> {
    const [contents] = await this.storage
      .bucket(this.bucket)
      .file(this.objectName(key))
      .download()
    return contents
  }

  async delete(key: string): Promise<void> {
    await this.storage
      .bucket(this.bucket)
      .file(this.objectName(key))
      .delete({ ignoreNotFound: true })
  }

  async getDownloadUrl(key: string, expiresIn = 300): Promise<string> {
    // If bucket is public, return a direct URL (no signed URL needed, no expiry)
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${this.objectName(key)}`
    }

    // Private bucket: generate a V4 signed URL
    const [url] = await this.storage
      .bucket(this.bucket)
      .file(this.objectName(key))
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      })
    return url
  }
}
