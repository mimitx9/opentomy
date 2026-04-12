Generate cryptographically secure keys for the .env file.

Steps:
1. Use Node.js crypto.randomBytes(32) to generate:
   - APP_MASTER_KEY (32 bytes → 64 hex chars)
   - SERVER_DECRYPT_SECRET (32 bytes → 64 hex chars)
   - NEXTAUTH_SECRET (32 bytes → base64)
2. Print them in .env format, ready to copy-paste:
   APP_MASTER_KEY="<hex>"
   SERVER_DECRYPT_SECRET="<hex>"
   NEXTAUTH_SECRET="<base64>"
3. Print a warning: "⚠ Keep SERVER_DECRYPT_SECRET server-only. Never embed in client/desktop builds."
4. Optionally ask if user wants to append these to the .env file
