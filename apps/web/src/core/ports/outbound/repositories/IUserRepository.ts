import type { User } from '../../../domain/entities/User'

export interface CreateUserInput {
  email: string
  passwordHash?: string | null
  name?: string | null
  keycloakId?: string | null
  avatarUrl?: string | null
}

export interface UpsertUserByKeycloakIdInput {
  keycloakId: string
  email: string
  name?: string | null
  avatarUrl?: string | null
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByKeycloakId(keycloakId: string): Promise<User | null>
  create(input: CreateUserInput): Promise<User>
  /** Find or create user by Keycloak sub — updates name/avatar if changed */
  upsertByKeycloakId(input: UpsertUserByKeycloakIdInput): Promise<User>
}
