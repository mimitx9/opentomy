export interface GenerateDecryptTokenResult {
  token: string
  expiresAt: Date
}

export interface ICryptoPort {
  generateDecryptToken(
    serverSecret: string,
    fileId: string,
    userId: string,
    ttlMs?: number,
  ): Promise<GenerateDecryptTokenResult>
}
