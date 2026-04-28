import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

const VALID_ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof VALID_ROLES)[number];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function serializeAccount(r: typeof usersTable.$inferSelect) {
  return {
    id: String(r.id),
    name: r.name,
    email: r.email,
    role: r.role,
    active: r.active,
    isColumnist: r.isColumnist,
    columnistSlug: r.columnistSlug,
    columnistTitle: r.columnistTitle,
    bio: r.bio,
    avatarUrl: r.avatarUrl,
    twitter: r.twitter,
    createdAt: r.createdAt,
  };
}

const DEMO_ACCOUNTS = [
  { id: "demo-1", name: "Editor", email: "editor@laliga.com", role: "editor" },
  { id: "demo-2", name: "Admin",  email: "admin@laliga.com",  role: "admin"  },
];

// List active accounts (used by article editor to pick co-authors)
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

// ----- Admin: list all accounts (with columnist fields) -----
router.get("/admin/accounts", async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    res.json(rows.map(serializeAccount));
  } catch (err) {
    console.error("[users] failed to list accounts", err);
    res.status(500).json({ error: "Failed to list accounts" });
  }
});

// ----- Admin: create account -----
router.post("/admin/accounts", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role: Role = VALID_ROLES.includes(body.role as Role) ? (body.role as Role) : "editor";
  const active = typeof body.active === "boolean" ? body.active : true;
  const isColumnist = body.isColumnist === true;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres." });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "E-mail inválido." });
    return;
  }

  const values: typeof usersTable.$inferInsert = {
    name,
    email,
    password,
    role,
    active,
    isColumnist,
  };

  if (isColumnist) {
    values.columnistSlug = slugify(name) || null;
    if (typeof body.columnistTitle === "string") values.columnistTitle = body.columnistTitle.trim() || null;
    if (typeof body.bio === "string") values.bio = body.bio.trim() || null;
    if (typeof body.avatarUrl === "string") values.avatarUrl = body.avatarUrl.trim() || null;
    if (typeof body.twitter === "string") values.twitter = body.twitter.replace(/^@/, "").trim() || null;
  }

  try {
    const [created] = await db.insert(usersTable).values(values).returning();
    if (!created) {
      res.status(500).json({ error: "Falha ao criar usuário." });
      return;
    }
    res.status(201).json(serializeAccount(created));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      res.status(409).json({ error: "Já existe uma conta com esse e-mail ou identificador." });
      return;
    }
    console.error("[users] failed to create account", err);
    res.status(500).json({ error: "Falha ao criar usuário." });
  }
});

// ----- Admin: delete account -----
router.delete("/admin/accounts/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id });

    if (!deleted) {
      res.status(404).json({ error: "Conta não encontrada." });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[users] failed to delete account", err);
    res.status(500).json({ error: "Falha ao excluir conta." });
  }
});

// ----- Admin: update account -----

router.patch("/admin/accounts/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = req.body ?? {};
  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) updates["name"] = body.name.trim();
  if (typeof body.email === "string" && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "E-mail inválido." });
      return;
    }
    updates["email"] = email;
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 6) {
      res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres." });
      return;
    }
    updates["password"] = body.password;
  }
  if (typeof body.role === "string" && VALID_ROLES.includes(body.role as Role)) {
    updates["role"] = body.role;
  }
  if (typeof body.isColumnist === "boolean") updates["isColumnist"] = body.isColumnist;
  if (typeof body.bio === "string" || body.bio === null) updates["bio"] = body.bio;
  if (typeof body.avatarUrl === "string" || body.avatarUrl === null) updates["avatarUrl"] = body.avatarUrl;
  if (typeof body.columnistTitle === "string" || body.columnistTitle === null) updates["columnistTitle"] = body.columnistTitle;
  if (typeof body.twitter === "string" || body.twitter === null) {
    updates["twitter"] = typeof body.twitter === "string" ? body.twitter.replace(/^@/, "") : body.twitter;
  }
  if (typeof body.active === "boolean") updates["active"] = body.active;

  if (typeof body.columnistSlug === "string" && body.columnistSlug.trim()) {
    updates["columnistSlug"] = slugify(body.columnistSlug);
  } else if (body.columnistSlug === null) {
    updates["columnistSlug"] = null;
  }

  // If turning into a columnist and no slug provided, derive from name
  if (updates["isColumnist"] === true && !updates["columnistSlug"]) {
    const [existing] = await db
      .select({
        name: usersTable.name,
        columnistSlug: usersTable.columnistSlug,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (existing && !existing.columnistSlug) {
      updates["columnistSlug"] = slugify(existing.name);
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  try {
    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    res.json({
      id: String(updated.id),
      name: updated.name,
      email: updated.email,
      role: updated.role,
      active: updated.active,
      isColumnist: updated.isColumnist,
      columnistSlug: updated.columnistSlug,
      columnistTitle: updated.columnistTitle,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      twitter: updated.twitter,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      res.status(409).json({ error: "Esse identificador já está em uso." });
      return;
    }
    console.error("[users] failed to update account", err);
    res.status(500).json({ error: "Failed to update account" });
  }
});

// ----- Public: list active columnists -----
router.get("/columnists", async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        slug: usersTable.columnistSlug,
        title: usersTable.columnistTitle,
        bio: usersTable.bio,
        avatarUrl: usersTable.avatarUrl,
        twitter: usersTable.twitter,
      })
      .from(usersTable)
      .where(and(eq(usersTable.active, true), eq(usersTable.isColumnist, true)))
      .orderBy(usersTable.name);

    res.json(rows.map((r) => ({ ...r, id: String(r.id) })));
  } catch (err) {
    console.error("[users] failed to list columnists", err);
    res.status(500).json({ error: "Failed to list columnists" });
  }
});

export default router;
