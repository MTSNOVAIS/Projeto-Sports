import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEMO_ACCOUNTS = [
  {
    email: "editor@laliga.com",
    password: "editor123",
    name: "Editor",
    role: "editor",
  },
  {
    email: "admin@laliga.com",
    password: "admin123",
    name: "Admin",
    role: "admin",
  },
];

export async function ensureDemoAccounts(): Promise<void> {
  try {
    for (const account of DEMO_ACCOUNTS) {
      const existing = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, account.email))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(usersTable).values(account);
        console.log(`[seed] Created demo account: ${account.email}`);
      }
    }
  } catch (err) {
    console.error("[seed] Failed to seed demo accounts", err);
  }
}
