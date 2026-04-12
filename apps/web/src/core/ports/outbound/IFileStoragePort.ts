export interface IFileStoragePort {
  upload(key: string, buffer: Buffer): Promise<void>
  getBuffer(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  getDownloadUrl(key: string, expiresIn?: number): Promise<string>
}
