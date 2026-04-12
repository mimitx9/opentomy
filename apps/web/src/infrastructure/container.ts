/**
 * Dependency Injection Container
 *
 * Wires infrastructure adapters to port interfaces.
 * To swap a tech: replace the adapter class, keep the use case unchanged.
 *
 * Example swaps:
 *  - S3 → Cloudflare R2 : replace S3FileStorageAdapter
 *  - Stripe → Paddle     : replace StripePaymentAdapter
 *  - MySQL → PostgreSQL  : change schema.prisma provider (Prisma repos stay the same)
 *  - Keycloak → Google   : change auth.ts provider (this file unchanged)
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

// ── Repositories ──────────────────────────────────────────────────────────────
const userRepo = new PrismaUserRepository()
const subscriptionRepo = new PrismaSubscriptionRepository()
const fileRepo = new PrismaFileRepository()
const accessRepo = new PrismaAccessRepository()
const decryptTokenRepo = new PrismaDecryptTokenRepository()
const attemptRepo = new PrismaQuizAttemptRepository()

// ── External Service Adapters ─────────────────────────────────────────────────
const fileStorage = new GCSFileStorageAdapter()
const payment = new StripePaymentAdapter()
const crypto = new NodeCryptoAdapter()

// ── Domain Services ───────────────────────────────────────────────────────────
const subscriptionService = new SubscriptionService()
const accessControl = new AccessControlService()
const quizScoring = new QuizScoringService()

// ── Use Cases (public API of the application core) ────────────────────────────
export const container = {
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
