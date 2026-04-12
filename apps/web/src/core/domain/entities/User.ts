export type UserRole = 'USER' | 'CREATOR' | 'ADMIN'

export interface User {
  id: string
  /** Keycloak `sub` claim. null for legacy credential-only users. */
  keycloakId?: string | null
  email: string
  name?: string | null
  avatarUrl?: string | null
  role: UserRole
  passwordHash?: string | null
  createdAt: Date
  updatedAt: Date
}
