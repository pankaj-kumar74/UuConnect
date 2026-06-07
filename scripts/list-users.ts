import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const rows = await sql`
  SELECT id, username, email, full_name, role, created_at
  FROM users
  ORDER BY id
`;

console.log(JSON.stringify(rows, null, 2));
