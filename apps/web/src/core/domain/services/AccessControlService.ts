import type { Subscription } from '../entities/Subscription'
import type { FileAccess } from '../entities/FileAccess'
import { SubscriptionService } from './SubscriptionService'

export class AccessControlService {
  private readonly subscriptionService = new SubscriptionService()

  canDecryptFile(
    subscription: Subscription | null | undefined,
    fileAccess: FileAccess | null | undefined,
  ): boolean {
    if (this.subscriptionService.canDecrypt(subscription)) return true

    const now = new Date()
    return fileAccess != null && (fileAccess.expiresAt == null || fileAccess.expiresAt > now)
  }

  canDeleteFile(userId: string, creatorId: string, userRole: string): boolean {
    return userId === creatorId || userRole === 'ADMIN'
  }
}
