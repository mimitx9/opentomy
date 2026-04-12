Seed the development database with test data.

Steps:
1. Connect to DB using PrismaClient from packages/db
2. Create a test user: { email: "test@opentomy.dev", password: "password123" (bcrypt hashed), name: "Test User", role: "CREATOR" }
3. Create a Subscription for the user: { tier: "PRO", status: "ACTIVE", stripeCustomerId: "cus_test_123" }
4. Create a sample QuizFile record (without actual file): { title: "Sample Quiz", questionCount: 5, tags: ["demo"] }
5. Create a FileAccess record: { accessType: "GIFTED" }
6. Print summary of what was created
7. Print the test user login credentials for easy reference
