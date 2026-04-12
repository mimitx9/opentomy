import { generateDecryptToken } from '@opentomy/crypto'
import type { ICryptoPort, GenerateDecryptTokenResult } from '../../core/ports/outbound/ICryptoPort'

export class NodeCryptoAdapter implements ICryptoPort {
  async generateDecryptToken(
    serverSecret: string,
    fileId: string,
    userId: string,
    ttlMs?: number,
  ): Promise<GenerateDecryptTokenResult> {
    return generateDecryptToken(serverSecret, fileId, userId, ttlMs)
  }
}
