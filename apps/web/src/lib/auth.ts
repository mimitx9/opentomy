import type { NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'

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
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.userId = profile.sub
        token.accessToken = account.access_token
        const roles =
          (profile as { realm_access?: { roles: string[] } }).realm_access?.roles ?? []
        token.role = roles.includes('admin')
          ? 'ADMIN'
          : roles.includes('creator')
            ? 'CREATOR'
            : 'USER'

        // Fetch internal user ID and subscription status at sign-in time
        try {
          const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
          const res = await fetch(`${apiUrl}/subscription/status`, {
            headers: { Authorization: `Bearer ${account.access_token}` },
          })
          if (res.ok) {
            const sub = await res.json()
            token.internalUserId = sub?.subscription?.user_id ?? null
            token.canDecrypt = sub?.can_decrypt ?? false
          }
        } catch {
          token.internalUserId = null
          token.canDecrypt = false
        }
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.role = token.role as string
      session.accessToken = token.accessToken as string
      session.internalUserId = (token.internalUserId as string | null) ?? null
      session.canDecrypt = (token.canDecrypt as boolean) ?? false
      return session
    },
  },
}
