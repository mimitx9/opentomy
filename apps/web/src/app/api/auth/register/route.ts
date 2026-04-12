import { NextResponse } from 'next/server'

/**
 * Registration is handled by Keycloak.
 *
 * To register a new user:
 *  - Self-service: enable Keycloak self-registration at
 *    {KEYCLOAK_ISSUER}/protocol/openid-connect/registrations
 *  - Admin: create users in Keycloak Admin Console → Realm → Users → Add user
 *
 * On first login via Keycloak, the user record is automatically created
 * in our database by ProvisionUserUseCase.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Registration is handled by Keycloak.',
      hint: 'Use the Keycloak sign-in page to register or ask your administrator.',
    },
    { status: 410 }, // 410 Gone — endpoint intentionally removed
  )
}
