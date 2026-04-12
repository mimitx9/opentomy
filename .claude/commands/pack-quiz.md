Pack a quiz JSON file into the .optmy binary format.

Usage: /pack-quiz <input-json-path> [output-path]

Steps:
1. Read the quiz JSON from the input path (first argument in $ARGUMENTS)
2. If no output path given, use same filename with .optmy extension
3. Validate the JSON matches the QuizPayload schema:
   - Must have: id (string), title (string), questions (array)
   - Each question must have: id, type, stem, options, correct_index
4. Import packQuiz from packages/crypto/src/optmy-format.ts
5. Read APP_MASTER_KEY from environment (.env file)
6. Build the header: { file_id, creator_user_id: "local", title, question_count, created_at, tags, schema_version: "1.0" }
7. Set flags: requires_license=1, subscription_only=1, trial_eligible=1
8. Call packQuiz(masterKey, quizPayload, header, flags) to get ArrayBuffer
9. Write the ArrayBuffer to the output path
10. Print: "Packed: {title} ({question_count} questions) → {output_path} ({file_size} bytes)"
