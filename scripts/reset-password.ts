import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";

const email = process.argv[2];
const newPassword = process.argv[3] || "Welcome123";

if (!email) {
  console.error("Usage: npx tsx scripts/reset-password.ts <email> [newPassword]");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);
const hashed = await bcrypt.hash(newPassword, 10);

const result = await sql`
  UPDATE users SET password = ${hashed}
  WHERE email = ${email}
  RETURNING id, username, email, full_name
`;

if (result.length === 0) {
  console.error("No user found with that email.");
  process.exit(1);
}

console.log("Password reset successful for:");
console.log(JSON.stringify(result[0], null, 2));
console.log(`New password: ${newPassword}`);
