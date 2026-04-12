Check the subscription and file access status for a user in the database.

Usage: /check-subscription <user-email> [file-id]

Steps:
1. Parse $ARGUMENTS: first arg = email, optional second = file-id
2. Connect to DB using PrismaClient from packages/db
3. Find user by email — print id, name, role, createdAt
4. Find Subscription record — print tier, status, trialEndsAt, currentPeriodEnd
5. Determine effective access level:
   - ACTIVE/TRIALING subscription → can decrypt any subscription_only file
   - FREE + no FileAccess → cannot decrypt
6. If file-id was provided:
   - Look up FileAccess for (userId, fileId)
   - Print access type, grantedAt, expiresAt
   - Print final verdict: "Would /api/decrypt succeed? YES / NO (reason)"
7. Print a summary table of all the above
