import type { NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'
import { container } from '@/infrastructure/container'

/**
 * NextAuth configuration — Keycloak as the sole identity provider.
 *
 * Auth flow:
 *  1. User clicks "Sign in" → redirected to Keycloak
 *  2. Keycloak authenticates → callback with profile + tokens
 *  3. `signIn` callback → ProvisionUserUseCase creates/syncs our DB record
 *  4. `jwt` callback → embeds our internal userId + role in the JWT
 *  5. `session` callback → exposes userId + role to the app
 *
 * To swap Keycloak for another provider (Google, Azure AD, etc.),
 * only this file and the KEYCLOAK_* env vars need to change.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],

  callbacks: {
    /**
     * Runs once after the provider authenticates the user.
     * We provision the user in our DB here.
     * Returning false blocks sign-in (e.g., banned users).
     */
    async signIn({ account, profile }) {
      if (!account || !profile) return false

      // Only handle Keycloak provider
      if (account.provider !== 'keycloak') return false

      const keycloakId = profile.sub
      if (!keycloakId) return false

      try {
        await container.provisionUser.execute({
          keycloakId,
          email: profile.email ?? '',
          name: (profile as { name?: string }).name ?? null,
          avatarUrl: (profile as { picture?: string }).picture ?? null,
        })
        return true
      } catch (err) {
        console.error('[NextAuth] ProvisionUser failed', err)
        return false
      }
    },

    /**
     * Embed our internal userId + role into the JWT.
     * We look up the user by keycloakId (stored in `token.sub` by Keycloak).
     */
    async jwt({ token, account, profile }) {
      // On first sign-in, account + profile are available
      if (account && profile?.sub) {
        const user = await container.getUserByKeycloakId.execute(profile.sub)
        if (user) {
          token.userId = user.id
          token.role = user.role
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
