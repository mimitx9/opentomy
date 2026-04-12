import { prisma } from '@opentomy/db'
import type {
  IUserRepository,
  CreateUserInput,
  UpsertUserByKeycloakIdInput,
} from '../../core/ports/outbound/repositories/IUserRepository'
import type { User } from '../../core/domain/entities/User'

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<User | null>
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } }) as Promise<User | null>
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { keycloakId } }) as Promise<User | null>
  }

  async create(input: CreateUserInput): Promise<User> {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        keycloakId: input.keycloakId,
        avatarUrl: input.avatarUrl,
      },
    }) as Promise<User>
  }

  async upsertByKeycloakId(input: UpsertUserByKeycloakIdInput): Promise<User> {
    return prisma.user.upsert({
      where: { keycloakId: input.keycloakId },
      update: {
        email: input.email,
        name: input.name,
        avatarUrl: input.avatarUrl,
      },
      create: {
        keycloakId: input.keycloakId,
        email: input.email,
        name: input.name,
        avatarUrl: input.avatarUrl,
      },
    }) as Promise<User>
  }
}
