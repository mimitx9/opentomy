/**
 * Dependency Injection Container — lazy singleton
 *
 * Wires infrastructure adapters to port interfaces.
 * Instantiated lazily on first request (not at build time) so that
 * env vars (GCS_KEY_BASE64, STRIPE_SECRET_KEY, etc.) are available.
 *
 * Example swaps:
 *  - GCS → S3/R2  : replace GCSFileStorageAdapter
 *  - Stripe → Paddle: replace StripePaymentAdapter
 *  - MySQL → Postgres: change schema.prisma provider
 *  - Keycloak → Google: change auth.ts provider (this file unchanged)
 */
import { PrismaUserRepository } from './repositories/PrismaUserRepository'
import { PrismaSubscriptionRepository } from './repositories/PrismaSubscriptionRepository'
import { PrismaFileRepository } from './repositories/PrismaFileRepository'
import { PrismaAccessRepository } from './repositories/PrismaAccessRepository'
import { PrismaDecryptTokenRepository } from './repositories/PrismaDecryptTokenRepository'
import { PrismaQuizAttemptRepository } from './repositories/PrismaQuizAttemptRepository'
import { GCSFileStorageAdapter } from './storage/GCSFileStorageAdapter'
import { StripePaymentAdapter } from './payment/StripePaymentAdapter'
import { NodeCryptoAdapter } from './crypto/NodeCryptoAdapter'

import { AccessControlService } from '../core/domain/services/AccessControlService'
import { QuizScoringService } from '../core/domain/services/QuizScoringService'
import { SubscriptionService } from '../core/domain/services/SubscriptionService'

// Auth
import { ProvisionUserUseCase } from '../core/usecases/auth/ProvisionUserUseCase'
import { GetUserByKeycloakIdUseCase } from '../core/usecases/auth/GetUserByKeycloakIdUseCase'
// Files
import { GetPublicFilesUseCase } from '../core/usecases/files/GetPublicFilesUseCase'
import { GetFileWithAccessUseCase } from '../core/usecases/files/GetFileWithAccessUseCase'
import { GetMyFilesUseCase } from '../core/usecases/files/GetMyFilesUseCase'
import { UploadQuizFileUseCase } from '../core/usecases/files/UploadQuizFileUseCase'
import { DeleteFileUseCase } from '../core/usecases/files/DeleteFileUseCase'
import { DownloadFileUseCase } from '../core/usecases/files/DownloadFileUseCase'
// Quiz
import { IssueDecryptTokenUseCase } from '../core/usecases/quiz/IssueDecryptTokenUseCase'
import { SubmitQuizAttemptUseCase } from '../core/usecases/quiz/SubmitQuizAttemptUseCase'
// Subscription
import { GetSubscriptionStatusUseCase } from '../core/usecases/subscription/GetSubscriptionStatusUseCase'
import { CreateCheckoutUseCase } from '../core/usecases/subscription/CreateCheckoutUseCase'
import { CreatePortalUseCase } from '../core/usecases/subscription/CreatePortalUseCase'
import { HandleStripeWebhookUseCase } from '../core/usecases/subscription/HandleStripeWebhookUseCase'

type Container = ReturnType<typeof createContainer>

function createContainer() {
  // ── Repositories ────────────────────────────────────────────────────────────
  const userRepo = new PrismaUserRepository()
  const subscriptionRepo = new PrismaSubscriptionRepository()
  const fileRepo = new PrismaFileRepository()
  const accessRepo = new PrismaAccessRepository()
  const decryptTokenRepo = new PrismaDecryptTokenRepository()
  const attemptRepo = new PrismaQuizAttemptRepository()

  // ── External Service Adapters ────────────────────────────────────────────────
  const fileStorage = new GCSFileStorageAdapter()
  const payment = new StripePaymentAdapter()
  const crypto = new NodeCryptoAdapter()

  // ── Domain Services ──────────────────────────────────────────────────────────
  const subscriptionService = new SubscriptionService()
  const accessControl = new AccessControlService()
  const quizScoring = new QuizScoringService()

  return {
    // Auth (Keycloak-driven)
    provisionUser: new ProvisionUserUseCase(userRepo, subscriptionRepo),
    getUserByKeycloakId: new GetUserByKeycloakIdUseCase(userRepo),

    // Files
    getPublicFiles: new GetPublicFilesUseCase(fileRepo),
    getFileWithAccess: new GetFileWithAccessUseCase(fileRepo, subscriptionRepo, accessRepo, accessControl),
    getMyFiles: new GetMyFilesUseCase(fileRepo),
    uploadQuizFile: new UploadQuizFileUseCase(fileRepo, fileStorage),
    deleteFile: new DeleteFileUseCase(fileRepo, fileStorage, accessControl),
    downloadFile: new DownloadFileUseCase(fileRepo, decryptTokenRepo, fileStorage),

    // Quiz
    issueDecryptToken: new IssueDecryptTokenUseCase(
      subscriptionRepo,
      accessRepo,
      decryptTokenRepo,
      accessControl,
      crypto,
    ),
    submitQuizAttempt: new SubmitQuizAttemptUseCase(attemptRepo, quizScoring),

    // Subscription
    getSubscriptionStatus: new GetSubscriptionStatusUseCase(subscriptionRepo, subscriptionService),
    createCheckout: new CreateCheckoutUseCase(subscriptionRepo, payment),
    createPortal: new CreatePortalUseCase(subscriptionRepo, payment),
    handleStripeWebhook: new HandleStripeWebhookUseCase(subscriptionRepo, payment),
  }
}

// Lazy singleton — instantiated only on first request, never at build time
let _container: Container | null = null

export const container: Container = new Proxy({} as Container, {
  get(_target, prop: string) {
    if (!_container) {
      _container = createContainer()
    }
    return _container[prop as keyof Container]
  },
})
