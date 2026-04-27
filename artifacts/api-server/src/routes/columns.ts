import { Router, type IRouter } from "express";
import { db, articlesTable, usersTable, teamsTable } from "@workspace/db";
import { eq, and, desc, count, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

// Public: list published columns
router.get("/columns", async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
  const offset = (page - 1) * limit;
  const search = req.query.search as string | undefined;
  const authorId = req.query.authorId ? parseInt(String(req.query.authorId), 10) : undefined;

  const conditions: any[] = [
    eq(articlesTable.kind, "column"),
    eq(articlesTable.status, "published"),
  ];
  if (authorId) conditions.push(eq(articlesTable.authorId, authorId));
  if (search) {
    conditions.push(
      or(
        ilike(articlesTable.title, `%${search}%`),
        ilike(articlesTable.excerpt, `%${search}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: articlesTable.id,
        title: articlesTable.title,
        slug: articlesTable.slug,
        subtitle: articlesTable.subtitle,
        excerpt: articlesTable.excerpt,
        coverImage: articlesTable.coverImage,
        category: articlesTable.category,
        authorName: articlesTable.authorName,
        authorId: articlesTable.authorId,
        coAuthors: articlesTable.coAuthors,
        teamId: articlesTable.teamId,
        teamName: teamsTable.name,
        teamSlug: teamsTable.slug,
        authorAvatarUrl: usersTable.avatarUrl,
        authorSlug: usersTable.columnistSlug,
        publishedAt: articlesTable.publishedAt,
        viewCount: articlesTable.viewCount,
      })
      .from(articlesTable)
      .leftJoin(usersTable, eq(articlesTable.authorId, usersTable.id))
      .leftJoin(teamsTable, eq(articlesTable.teamId, teamsTable.id))
      .where(whereClause)
      .orderBy(desc(articlesTable.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(articlesTable).where(whereClause),
  ]);

  const total = totalRow[0]?.count ?? 0;
  res.json({
    columns: rows.map((r) => ({
      ...r,
      publishedAt: r.publishedAt?.toISOString() ?? null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// Public: single columnist profile + their columns
router.get("/columnists/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  if (!slug) {
    res.status(400).json({ error: "Slug is required" });
    return;
  }

  const [columnist] = await db
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
    .where(
      and(
        eq(usersTable.active, true),
        eq(usersTable.isColumnist, true),
        eq(usersTable.columnistSlug, slug),
      ),
    )
    .limit(1);

  if (!columnist) {
    res.status(404).json({ error: "Columnist not found" });
    return;
  }

  const columns = await db
    .select({
      id: articlesTable.id,
      title: articlesTable.title,
      slug: articlesTable.slug,
      excerpt: articlesTable.excerpt,
      coverImage: articlesTable.coverImage,
      category: articlesTable.category,
      authorName: articlesTable.authorName,
      publishedAt: articlesTable.publishedAt,
      viewCount: articlesTable.viewCount,
    })
    .from(articlesTable)
    .where(
      and(
        eq(articlesTable.kind, "column"),
        eq(articlesTable.status, "published"),
        eq(articlesTable.authorId, columnist.id),
      ),
    )
    .orderBy(desc(articlesTable.publishedAt));

  res.json({
    columnist: { ...columnist, id: String(columnist.id) },
    columns: columns.map((c) => ({
      ...c,
      publishedAt: c.publishedAt?.toISOString() ?? null,
    })),
  });
});

export default router;
