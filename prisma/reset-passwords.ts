/**
 * Reset all seeded user passwords directly using Better Auth's scrypt format.
 * Run with: npx ts-node prisma/reset-passwords.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";

const prisma = new PrismaClient();

// Same scrypt params as @better-auth/utils/password.node.mjs
const cfg = { N: 16384, r: 16, p: 1, dkLen: 64 };

function generateKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      cfg.dkLen,
      { N: cfg.N, r: cfg.r, p: cfg.p, maxmem: 128 * cfg.N * cfg.r * 2 },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key  = await generateKey(password, salt);
  return `${salt}:${key.toString("hex")}`;
}

// email → plain-text password mapping
const PASSWORDS: Record<string, string> = {
  "admin@noorventure.com":     "Admin1234!",
  "rafsan@noorventure.com":    "Owner1234!",
  "sultana@noorventure.com":   "Owner1234!",
  "karim@noorventure.com":     "Owner1234!",
  "farida@noorventure.com":    "Owner1234!",
  "investor1@noorventure.com": "Invest1234!",
  "investor2@noorventure.com": "Invest1234!",
  "investor3@noorventure.com": "Invest1234!",
  "investor4@noorventure.com": "Invest1234!",
  "investor5@noorventure.com": "Invest1234!",
};

async function main() {
  console.log("🔑 Resetting passwords for all seeded users...\n");

  for (const [email, plainPassword] of Object.entries(PASSWORDS)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { console.log(`  ⚠️  User not found: ${email}`); continue; }

    // Find the credential account for this user
    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (!account) { console.log(`  ⚠️  No credential account for: ${email}`); continue; }

    const newHash = await hashPassword(plainPassword);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: newHash },
    });

    console.log(`  ✅ ${email} → password reset`);
  }

  console.log("\n🎉 Done! Try logging in now:");
  console.log("   Admin:    admin@noorventure.com    / Admin1234!");
  console.log("   Owner:    rafsan@noorventure.com   / Owner1234!");
  console.log("   Investor: investor1@noorventure.com / Invest1234!");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
