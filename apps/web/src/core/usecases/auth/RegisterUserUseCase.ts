import bcrypt from 'bcryptjs'
import type { IUserRepository } from '../../ports/outbound/repositories/IUserRepository'
import type { ISubscriptionRepository } from '../../ports/outbound/repositories/ISubscriptionRepository'
import { ConflictException, ValidationException } from '../../domain/exceptions/DomainException'

export interface RegisterUserInput {
  email: string
  password: string
  name?: string | null
}

export interface RegisterUserOutput {
  userId: string
  email: string
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly subscriptionRepo: ISubscriptionRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    if (!input.email || !input.password) {
      throw new ValidationException('Email and password are required')
    }

    const existing = await this.userRepo.findByEmail(input.email)
    if (existing) {
      throw new ConflictException('Email already registered')
    }

    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      name: input.name,
    })

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    await this.subscriptionRepo.create({
      userId: user.id,
      stripeCustomerId: `pending_${Date.now()}`,
      status: 'TRIALING',
      tier: 'FREE',
      trialEndsAt,
    })

    return { userId: user.id, email: user.email }
  }
}
