import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEMO_ACCOUNTS = [
  { id: "demo-1", name: "Editor", email: "editor@laliga.com", role: "editor" },
  { id: "demo-2", name: "Admin",  email: "admin@laliga.com",  role: "admin"  },
];

router.get("/users", async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.active, true));

    if (rows.length === 0) {
      res.json(DEMO_ACCOUNTS);
      return;
    }
    res.json(rows.map(r => ({ ...r, id: String(r.id) })));
  } catch {
    res.json(DEMO_ACCOUNTS);
  }
});

export default router;
