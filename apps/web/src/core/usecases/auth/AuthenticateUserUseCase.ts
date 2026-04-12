import bcrypt from 'bcryptjs'
import type { IUserRepository } from '../../ports/outbound/repositories/IUserRepository'
import type { User } from '../../domain/entities/User'

export interface AuthenticateUserInput {
  email: string
  password: string
}

export class AuthenticateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: AuthenticateUserInput): Promise<User | null> {
    const user = await this.userRepo.findByEmail(input.email)
    if (!user || !user.passwordHash) return null

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) return null

    return user
  }
}
