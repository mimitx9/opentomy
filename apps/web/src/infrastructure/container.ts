import { prisma } from '@opentomy/db'
import { PrismaUserRepository } from './repositories/PrismaUserRepository'
import { PrismaSubscriptionRepository } from './repositories/PrismaSubscriptionRepository'
import { PrismaFileRepository } from './repositories/PrismaFileRepository'
import { PrismaAccessRepository } from './repositories/PrismaAccessRepository'
import { PrismaQuizAttemptRepository } from './repositories/PrismaQuizAttemptRepository'
import { StripePaymentAdapter } from './payment/StripePaymentAdapter'

import { AccessControlService } from '../core/domain/services/AccessControlService'
import { QuizScoringService } from '../core/domain/services/QuizScoringService'
import { SubscriptionService } from '../core/domain/services/SubscriptionService'

import { ProvisionUserUseCase } from '../core/usecases/auth/ProvisionUserUseCase'
import { GetUserByKeycloakIdUseCase } from '../core/usecases/auth/GetUserByKeycloakIdUseCase'
import { GetPublicFilesUseCase } from '../core/usecases/files/GetPublicFilesUseCase'
import { GetFileWithAccessUseCase } from '../core/usecases/files/GetFileWithAccessUseCase'
import { GetMyFilesUseCase } from '../core/usecases/files/GetMyFilesUseCase'
import { UploadQuizFileUseCase } from '../core/usecases/files/UploadQuizFileUseCase'
import { DeleteFileUseCase } from '../core/usecases/files/DeleteFileUseCase'
import { SubmitQuizAttemptUseCase } from '../core/usecases/quiz/SubmitQuizAttemptUseCase'
import { GetSubscriptionStatusUseCase } from '../core/usecases/subscription/GetSubscriptionStatusUseCase'
import { CreateCheckoutUseCase } from '../core/usecases/subscription/CreateCheckoutUseCase'
import { CreatePortalUseCase } from '../core/usecases/subscription/CreatePortalUseCase'
import { HandleStripeWebhookUseCase } from '../core/usecases/subscription/HandleStripeWebhookUseCase'

type Container = ReturnType<typeof createContainer>

function createContainer() {
  const userRepo = new PrismaUserRepository()
  const subscriptionRepo = new PrismaSubscriptionRepository()
  const fileRepo = new PrismaFileRepository()
  const accessRepo = new PrismaAccessRepository()
  const attemptRepo = new PrismaQuizAttemptRepository()

  const payment = new StripePaymentAdapter()
  const subscriptionService = new SubscriptionService()
  const accessControl = new AccessControlService()
  const quizScoring = new QuizScoringService()

  return {
    provisionUser: new ProvisionUserUseCase(userRepo, subscriptionRepo),
    getUserByKeycloakId: new GetUserByKeycloakIdUseCase(userRepo),
    getPublicFiles: new GetPublicFilesUseCase(fileRepo),
    getFileWithAccess: new GetFileWithAccessUseCase(fileRepo, subscriptionRepo, accessRepo, accessControl),
    getMyFiles: new GetMyFilesUseCase(fileRepo),
    uploadQuizFile: new UploadQuizFileUseCase(fileRepo, prisma),
    deleteFile: new DeleteFileUseCase(fileRepo, accessControl),
    submitQuizAttempt: new SubmitQuizAttemptUseCase(attemptRepo, quizScoring),
    getSubscriptionStatus: new GetSubscriptionStatusUseCase(subscriptionRepo, subscriptionService),
    createCheckout: new CreateCheckoutUseCase(subscriptionRepo, payment),
    createPortal: new CreatePortalUseCase(subscriptionRepo, payment),
    handleStripeWebhook: new HandleStripeWebhookUseCase(subscriptionRepo, payment),
  }
}

let _container: Container | null = null

export const container: Container = new Proxy({} as Container, {
  get(_target, prop: string) {
    if (!_container) _container = createContainer()
    return _container[prop as keyof Container]
  },
})
