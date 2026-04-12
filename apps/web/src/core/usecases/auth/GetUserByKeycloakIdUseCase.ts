import type { IUserRepository } from '../../ports/outbound/repositories/IUserRepository'
import type { User } from '../../domain/entities/User'

export class GetUserByKeycloakIdUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(keycloakId: string): Promise<User | null> {
    return this.userRepo.findByKeycloakId(keycloakId)
  }
}
