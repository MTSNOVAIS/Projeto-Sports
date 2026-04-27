import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email e senha são obrigatórios" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .limit(1);

    if (!user || user.password !== password || !user.active) {
      res.status(401).json({ error: "E-mail ou senha inválidos" });
      return;
    }

    res.json({
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      isColumnist: user.isColumnist,
      columnistSlug: user.columnistSlug,
      columnistTitle: user.columnistTitle,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      twitter: user.twitter,
    });
  } catch (err) {
    console.error("[auth] login failed", err);
    res.status(500).json({ error: "Falha ao autenticar" });
  }
});

// Returns the current user's full profile by id (used to refresh after edits)
router.get("/auth/me/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      isColumnist: user.isColumnist,
      columnistSlug: user.columnistSlug,
      columnistTitle: user.columnistTitle,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      twitter: user.twitter,
    });
  } catch (err) {
    console.error("[auth] me failed", err);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
