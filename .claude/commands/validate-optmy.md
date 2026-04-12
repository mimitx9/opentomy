Validate a .optmy file's structure and integrity without decrypting the content.

Usage: /validate-optmy <file-path>

Steps:
1. Read the file at the path given in $ARGUMENTS as binary (Buffer/ArrayBuffer)
2. Import parseOptmyBuffer from packages/crypto/src/optmy-format.ts
3. Call parseOptmyBuffer(buffer) — catch any OptmyFormatError
4. Print the plaintext header fields: file_id, title, question_count, created_at, tags, schema_version
5. Print the flags byte in binary and interpret each bit:
   - Bit 0 (requires_license): yes/no
   - Bit 1 (subscription_only): yes/no
   - Bit 2 (trial_eligible): yes/no
6. Print file size and version
7. Print: "✓ VALID" or "✗ INVALID: <error message>"
