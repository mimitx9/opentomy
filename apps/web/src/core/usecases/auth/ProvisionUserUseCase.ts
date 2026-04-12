/**
 * ProvisionUserUseCase
 *
 * Called from the NextAuth `signIn` callback after Keycloak authentication.
 * - First login: creates User + Subscription (14-day trial)
 * - Subsequent logins: syncs email/name/avatar from Keycloak
 *
 * This is the ONLY place where user records are created for Keycloak users.
 * No password, no manual registration needed.
 */
import type { IUserRepository } from '../../ports/outbound/repositories/IUserRepository'
import type { ISubscriptionRepository } from '../../ports/outbound/repositories/ISubscriptionRepository'
import type { User } from '../../domain/entities/User'

export interface ProvisionUserInput {
  /** Keycloak `sub` claim — stable unique identifier */
  keycloakId: string
  email: string
  name?: string | null
  avatarUrl?: string | null
}

export interface ProvisionUserOutput {
  userId: string
  email: string
  role: User['role']
  isNewUser: boolean
}

export class ProvisionUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly subscriptionRepo: ISubscriptionRepository,
  ) {}

  async execute(input: ProvisionUserInput): Promise<ProvisionUserOutput> {
    // Check if this Keycloak user already has an account
    const existingUser = await this.userRepo.findByKeycloakId(input.keycloakId)
    const isNewUser = !existingUser

    // Upsert: create on first login, update name/avatar on subsequent logins
    const user = await this.userRepo.upsertByKeycloakId({
      keycloakId: input.keycloakId,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
    })

    // Only create subscription for brand new users
    if (isNewUser) {
      const existingSub = await this.subscriptionRepo.findByUserId(user.id)
      if (!existingSub) {
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        await this.subscriptionRepo.create({
          userId: user.id,
          stripeCustomerId: `pending_${Date.now()}`,
          status: 'TRIALING',
          tier: 'FREE',
          trialEndsAt,
        })
      }
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      isNewUser,
    }
  }
}
