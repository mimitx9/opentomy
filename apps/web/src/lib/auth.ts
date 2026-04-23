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
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.role = token.role as string
      session.accessToken = token.accessToken as string
      return session
    },
  },
}
