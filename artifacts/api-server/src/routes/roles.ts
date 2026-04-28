import { Router, type IRouter } from "express";
import { db, rolesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

const ALLOWED_PERMISSIONS = [
  "view_dashboard",
  "manage_articles",
  "create_articles",
  "edit_articles",
  "delete_articles",
  "publish_articles",
  "manage_teams",
  "create_teams",
  "edit_teams",
  "delete_teams",
  "manage_users",
  "create_users",
  "edit_users",
  "delete_users",
  "manage_roles",
  "import_articles",
  "view_stats",
] as const;

const SYSTEM_ROLES: Array<{
  key: string;
  name: string;
  description: string;
  permissions: string[];
}> = [
  {
    key: "admin",
    name: "Administrador",
    description: "Acesso total ao sistema",
    permissions: [...ALLOWED_PERMISSIONS],
  },
  {
    key: "editor",
    name: "Editor",
    description: "Pode criar e editar artigos",
    permissions: [
      "view_dashboard",
      "manage_articles",
      "create_articles",
      "edit_articles",
      "publish_articles",
      "view_stats",
    ],
  },
  {
    key: "viewer",
    name: "Visualizador",
    description: "Apenas leitura",
    permissions: ["view_dashboard", "view_stats"],
  },
];

function slugifyKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function sanitizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<string>(ALLOWED_PERMISSIONS);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of input) {
    if (typeof item === "string" && allowed.has(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

function serializeRole(r: typeof rolesTable.$inferSelect) {
  return {
    id: String(r.id),
    key: r.key,
    name: r.name,
    description: r.description,
    permissions: r.permissions,
    system: r.system,
    createdAt: r.createdAt,
  };
}

export async function ensureSystemRoles(): Promise<void> {
  try {
    for (const role of SYSTEM_ROLES) {
      const [existing] = await db
        .select({ id: rolesTable.id })
        .from(rolesTable)
        .where(eq(rolesTable.key, role.key))
        .limit(1);
      if (!existing) {
        await db.insert(rolesTable).values({ ...role, system: true });
        console.log(`[seed] Created system role: ${role.key}`);
      }
    }
  } catch (err) {
    console.error("[seed] Failed to seed roles", err);
  }
}

router.get("/admin/roles/permissions", (_req, res): void => {
  res.json({ permissions: ALLOWED_PERMISSIONS });
});

router.get("/admin/roles", async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(rolesTable)
      .orderBy(asc(rolesTable.id));
    res.json(rows.map(serializeRole));
  } catch (err) {
    console.error("[roles] failed to list", err);
    res.status(500).json({ error: "Falha ao listar cargos" });
  }
});

router.post("/admin/roles", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const permissions = sanitizePermissions(body.permissions);

  if (!name) {
    res.status(400).json({ error: "Nome do cargo é obrigatório." });
    return;
  }

  let key = typeof body.key === "string" && body.key.trim() ? slugifyKey(body.key) : slugifyKey(name);
  if (!key) {
    res.status(400).json({ error: "Identificador inválido para o cargo." });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.key, key))
      .limit(1);
    if (existing) {
      key = `${key}_${Date.now().toString(36)}`;
    }

    const [created] = await db
      .insert(rolesTable)
      .values({ key, name, description, permissions, system: false })
      .returning();
    if (!created) {
      res.status(500).json({ error: "Falha ao criar cargo." });
      return;
    }
    res.status(201).json(serializeRole(created));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ error: "Já existe um cargo com esse identificador." });
      return;
    }
    console.error("[roles] failed to create", err);
    res.status(500).json({ error: "Falha ao criar cargo." });
  }
});

router.patch("/admin/roles/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = req.body ?? {};
  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) updates["name"] = body.name.trim();
  if (typeof body.description === "string") updates["description"] = body.description.trim();
  if (Array.isArray(body.permissions)) updates["permissions"] = sanitizePermissions(body.permissions);

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nada para atualizar." });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Cargo não encontrado." });
      return;
    }

    const [updated] = await db
      .update(rolesTable)
      .set(updates)
      .where(eq(rolesTable.id, id))
      .returning();
    if (!updated) {
      res.status(500).json({ error: "Falha ao atualizar cargo." });
      return;
    }
    res.json(serializeRole(updated));
  } catch (err) {
    console.error("[roles] failed to update", err);
    res.status(500).json({ error: "Falha ao atualizar cargo." });
  }
});

router.delete("/admin/roles/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Cargo não encontrado." });
      return;
    }
    if (existing.system) {
      res.status(400).json({ error: "Cargos do sistema não podem ser excluídos." });
      return;
    }

    await db.delete(rolesTable).where(eq(rolesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("[roles] failed to delete", err);
    res.status(500).json({ error: "Falha ao excluir cargo." });
  }
});

export default router;
