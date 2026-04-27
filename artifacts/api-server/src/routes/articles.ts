import { Router, type IRouter } from "express";
import { db, articlesTable, teamsTable } from "@workspace/db";
import { eq, and, desc, like, or, ilike, sql, count } from "drizzle-orm";

const router: IRouter = Router();

// Helper function to strip HTML tags from text
function stripHtmlTags(text: string): string {
  let result = text;
  
  // Remove script tags and all their content (case-insensitive, handles multiline)
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  
  // Remove style tags and all their content
  result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  
  // Remove noscript tags and content
  result = result.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  
  // Remove iframe tags and content
  result = result.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, " ");
  
  // Remove comment tags
  result = result.replace(/<!--[\s\S]*?-->/g, " ");
  
  // Remove all HTML tags
  result = result.replace(/<[^>]*>/g, " ");
  
  // Decode HTML entities
  result = result
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, "—")
    .replace(/&#8211;/g, "–")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");  // Must be last to avoid double-decoding
  
  // Remove any remaining code patterns
  result = result
    .replace(/\bvar\s+\w+\s*=\s*[^;]*;/g, "")  // var declarations
    .replace(/\blet\s+\w+\s*=\s*[^;]*;/g, "")  // let declarations  
    .replace(/\bconst\s+\w+\s*=\s*[^;]*;/g, "")  // const declarations
    .replace(/\bfunction\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g, "");  // function declarations
  
  // Clean up multiple spaces
  result = result.replace(/\s+/g, " ").trim();
  
  return result;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 100) + "-" + Date.now().toString(36);
}

router.get("/articles", async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
  const offset = (page - 1) * limit;
  const category = req.query.category as string | undefined;
  const teamId = req.query.teamId ? parseInt(String(req.query.teamId), 10) : undefined;
  const featured = req.query.featured !== undefined ? req.query.featured === "true" : undefined;
  const search = req.query.search as string | undefined;
  const kind = (req.query.kind as string | undefined) ?? "article";

  const conditions: any[] = [];

  if (kind && kind !== "all") conditions.push(eq(articlesTable.kind, kind));
  if (category) conditions.push(eq(articlesTable.category, category));
  if (teamId) conditions.push(eq(articlesTable.teamId, teamId));
  if (featured !== undefined) conditions.push(eq(articlesTable.featured, featured));
  if (search) {
    conditions.push(
      or(
        ilike(articlesTable.title, `%${search}%`),
        ilike(articlesTable.excerpt, `%${search}%`)
      )!
    );
  }

  const whereClause = and(...conditions);

  const [articlesResult, totalResult] = await Promise.all([
    db.select({
      id: articlesTable.id,
      title: articlesTable.title,
      slug: articlesTable.slug,
      subtitle: articlesTable.subtitle,
      excerpt: articlesTable.excerpt,
      content: articlesTable.content,
      coverImage: articlesTable.coverImage,
      status: articlesTable.status,
      featured: articlesTable.featured,
      breakingNews: articlesTable.breakingNews,
      category: articlesTable.category,
      authorName: articlesTable.authorName,
      authorId: articlesTable.authorId,
      coAuthors: articlesTable.coAuthors,
      kind: articlesTable.kind,
      teamId: articlesTable.teamId,
      teamName: teamsTable.name,
      teamSlug: teamsTable.slug,
      sourceUrl: articlesTable.sourceUrl,
      sourceName: articlesTable.sourceName,
      publishedAt: articlesTable.publishedAt,
      scheduledAt: articlesTable.scheduledAt,
      viewCount: articlesTable.viewCount,
      createdAt: articlesTable.createdAt,
      updatedAt: articlesTable.updatedAt,
    })
      .from(articlesTable)
      .leftJoin(teamsTable, eq(articlesTable.teamId, teamsTable.id))
      .where(whereClause)
      .orderBy(desc(articlesTable.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(articlesTable).where(whereClause),
  ]);

  const total = totalResult[0]?.count ?? 0;
  res.json({
    articles: articlesResult.map(a => ({
      ...a,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      scheduledAt: a.scheduledAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/articles/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;

  const [article] = await db.select({
    id: articlesTable.id,
    title: articlesTable.title,
    slug: articlesTable.slug,
    subtitle: articlesTable.subtitle,
    excerpt: articlesTable.excerpt,
    content: articlesTable.content,
    coverImage: articlesTable.coverImage,
    status: articlesTable.status,
    featured: articlesTable.featured,
    breakingNews: articlesTable.breakingNews,
    category: articlesTable.category,
    authorName: articlesTable.authorName,
    authorId: articlesTable.authorId,
    coAuthors: articlesTable.coAuthors,
    kind: articlesTable.kind,
    teamId: articlesTable.teamId,
    teamName: teamsTable.name,
    teamSlug: teamsTable.slug,
    sourceUrl: articlesTable.sourceUrl,
    sourceName: articlesTable.sourceName,
    publishedAt: articlesTable.publishedAt,
    scheduledAt: articlesTable.scheduledAt,
    viewCount: articlesTable.viewCount,
    createdAt: articlesTable.createdAt,
    updatedAt: articlesTable.updatedAt,
  })
    .from(articlesTable)
    .leftJoin(teamsTable, eq(articlesTable.teamId, teamsTable.id))
    .where(eq(articlesTable.slug, slug));

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  // Increment view count
  await db
    .update(articlesTable)
    .set({ viewCount: sql`${articlesTable.viewCount} + 1` })
    .where(eq(articlesTable.id, article.id));

  res.json({
    ...article,
    viewCount: article.viewCount + 1,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  });
});

// Admin routes
router.get("/admin/articles", async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const category = req.query.category as string | undefined;
  const teamId = req.query.teamId ? parseInt(String(req.query.teamId), 10) : undefined;
  const source = req.query.source as string | undefined;
  const search = req.query.search as string | undefined;

  const kind = req.query.kind as string | undefined;
  const authorId = req.query.authorId ? parseInt(String(req.query.authorId), 10) : undefined;

  const conditions = [];
  if (status) conditions.push(eq(articlesTable.status, status));
  if (category) conditions.push(eq(articlesTable.category, category));
  if (teamId) conditions.push(eq(articlesTable.teamId, teamId));
  if (source) conditions.push(eq(articlesTable.sourceName, source));
  if (kind && kind !== "all") conditions.push(eq(articlesTable.kind, kind));
  if (authorId) conditions.push(eq(articlesTable.authorId, authorId));
  if (search) {
    conditions.push(
      or(
        ilike(articlesTable.title, `%${search}%`),
        ilike(articlesTable.excerpt, `%${search}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [articlesResult, totalResult] = await Promise.all([
    db.select({
      id: articlesTable.id,
      title: articlesTable.title,
      slug: articlesTable.slug,
      subtitle: articlesTable.subtitle,
      excerpt: articlesTable.excerpt,
      content: articlesTable.content,
      coverImage: articlesTable.coverImage,
      status: articlesTable.status,
      featured: articlesTable.featured,
      breakingNews: articlesTable.breakingNews,
      category: articlesTable.category,
      authorName: articlesTable.authorName,
      authorId: articlesTable.authorId,
      coAuthors: articlesTable.coAuthors,
      kind: articlesTable.kind,
      teamId: articlesTable.teamId,
      teamName: teamsTable.name,
      teamSlug: teamsTable.slug,
      sourceUrl: articlesTable.sourceUrl,
      sourceName: articlesTable.sourceName,
      publishedAt: articlesTable.publishedAt,
      scheduledAt: articlesTable.scheduledAt,
      viewCount: articlesTable.viewCount,
      createdAt: articlesTable.createdAt,
      updatedAt: articlesTable.updatedAt,
    })
      .from(articlesTable)
      .leftJoin(teamsTable, eq(articlesTable.teamId, teamsTable.id))
      .where(whereClause)
      .orderBy(desc(articlesTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(articlesTable).where(whereClause),
  ]);

  const total = totalResult[0]?.count ?? 0;
  res.json({
    articles: articlesResult.map(a => ({
      ...a,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      scheduledAt: a.scheduledAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/admin/articles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [article] = await db.select({
    id: articlesTable.id,
    title: articlesTable.title,
    slug: articlesTable.slug,
    subtitle: articlesTable.subtitle,
    excerpt: articlesTable.excerpt,
    content: articlesTable.content,
    coverImage: articlesTable.coverImage,
    status: articlesTable.status,
    featured: articlesTable.featured,
    breakingNews: articlesTable.breakingNews,
    category: articlesTable.category,
    authorName: articlesTable.authorName,
    authorId: articlesTable.authorId,
    coAuthors: articlesTable.coAuthors,
    kind: articlesTable.kind,
    teamId: articlesTable.teamId,
    teamName: teamsTable.name,
    teamSlug: teamsTable.slug,
    sourceUrl: articlesTable.sourceUrl,
    sourceName: articlesTable.sourceName,
    publishedAt: articlesTable.publishedAt,
    scheduledAt: articlesTable.scheduledAt,
    viewCount: articlesTable.viewCount,
    createdAt: articlesTable.createdAt,
    updatedAt: articlesTable.updatedAt,
  })
    .from(articlesTable)
    .leftJoin(teamsTable, eq(articlesTable.teamId, teamsTable.id))
    .where(eq(articlesTable.id, id));

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json({
    ...article,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  });
});

router.post("/admin/articles", async (req, res): Promise<void> => {
  const { title, subtitle, excerpt, content, coverImage, status, featured, breakingNews, category, authorName, authorId, coAuthors, kind, teamId, sourceUrl, sourceName, scheduledAt } = req.body;

  if (!title || !excerpt || !content) {
    res.status(400).json({ error: "title, excerpt and content are required" });
    return;
  }

  // Strip HTML tags from all text fields
  const cleanTitle = stripHtmlTags(title);
  const cleanSubtitle = subtitle ? stripHtmlTags(subtitle) : null;
  const cleanExcerpt = stripHtmlTags(excerpt);
  const cleanContent = stripHtmlTags(content);
  const slug = generateSlug(cleanTitle);
  const publishedAt = status === "published" ? new Date() : undefined;
  const scheduledAtDate = scheduledAt ? new Date(scheduledAt) : undefined;

  const sanitizedCoAuthors = Array.isArray(coAuthors)
    ? coAuthors
        .filter((c: any) => c && typeof c.name === "string" && c.name.trim())
        .map((c: any) => ({
          id: c.id ? String(c.id) : undefined,
          name: String(c.name).trim(),
          email: typeof c.email === "string" ? c.email : undefined,
          external: c.external === true,
        }))
    : [];

  const safeKind = kind === "column" ? "column" : "article";
  const safeAuthorId = typeof authorId === "number" && Number.isFinite(authorId) ? authorId : null;

  const [article] = await db.insert(articlesTable).values({
    title: cleanTitle,
    slug,
    subtitle: cleanSubtitle,
    excerpt: cleanExcerpt,
    content: cleanContent,
    coverImage: coverImage || null,
    status: status || "draft",
    featured: featured || false,
    breakingNews: breakingNews || false,
    category: category || "La Liga",
    authorName: authorName || "Redação",
    authorId: safeAuthorId,
    coAuthors: sanitizedCoAuthors,
    kind: safeKind,
    teamId: teamId || null,
    sourceUrl: sourceUrl || null,
    sourceName: sourceName || null,
    publishedAt: publishedAt ? publishedAt : null,
    scheduledAt: scheduledAtDate ? scheduledAtDate : null,
  }).returning();

  res.status(201).json({
    ...article,
    teamName: null,
    teamSlug: null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  });
});

router.put("/admin/articles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const { title, subtitle, excerpt, content, coverImage, status, featured, breakingNews, category, authorName, authorId, coAuthors, kind, teamId, sourceUrl, sourceName, scheduledAt } = req.body;

  const existing = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
  if (!existing.length) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  const sanitizedCoAuthors = Array.isArray(coAuthors)
    ? coAuthors
        .filter((c: any) => c && typeof c.name === "string" && c.name.trim())
        .map((c: any) => ({
          id: c.id ? String(c.id) : undefined,
          name: String(c.name).trim(),
          email: typeof c.email === "string" ? c.email : undefined,
          external: c.external === true,
        }))
    : undefined;

  // Strip HTML tags from all text fields
  const updateData: Partial<typeof articlesTable.$inferInsert> = {
    title: title ? stripHtmlTags(title) : undefined,
    subtitle: subtitle ? stripHtmlTags(subtitle) : undefined,
    excerpt: excerpt ? stripHtmlTags(excerpt) : undefined,
    content: content ? stripHtmlTags(content) : undefined,
    coverImage: coverImage || null,
    status,
    featured: featured || false,
    breakingNews: breakingNews || false,
    category,
    authorName,
    teamId: teamId || null,
    sourceUrl: sourceUrl || null,
    sourceName: sourceName || null,
  };

  if (sanitizedCoAuthors !== undefined) updateData.coAuthors = sanitizedCoAuthors;
  if (kind === "column" || kind === "article") updateData.kind = kind;
  if (typeof authorId === "number" && Number.isFinite(authorId)) updateData.authorId = authorId;
  else if (authorId === null) updateData.authorId = null;

  if (scheduledAt) {
    updateData.scheduledAt = new Date(scheduledAt);
  } else {
    updateData.scheduledAt = null;
  }

  if (status === "published" && !existing[0].publishedAt) {
    updateData.publishedAt = new Date();
  }

  const [article] = await db.update(articlesTable).set(updateData).where(eq(articlesTable.id, id)).returning();

  res.json({
    ...article,
    teamName: null,
    teamSlug: null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  });
});

router.delete("/admin/articles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const deleted = await db.delete(articlesTable).where(eq(articlesTable.id, id)).returning();
  if (!deleted.length) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/admin/articles/:id/publish", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [existing] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  const [article] = await db
    .update(articlesTable)
    .set({
      status: "published",
      publishedAt: existing.publishedAt ?? new Date(),
      scheduledAt: null,
    })
    .where(eq(articlesTable.id, id))
    .returning();

  res.json({
    ...article,
    teamName: null,
    teamSlug: null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  });
});

// Lightweight toggle for featured/breakingNews flags.
// Only updates the highlight flags, doesn't touch any other field.
router.patch("/admin/articles/:id/highlights", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const { featured, breakingNews } = req.body ?? {};
  const updateData: Partial<typeof articlesTable.$inferInsert> = {};
  if (typeof featured === "boolean") updateData.featured = featured;
  if (typeof breakingNews === "boolean") updateData.breakingNews = breakingNews;

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "featured or breakingNews boolean is required" });
    return;
  }

  const [article] = await db
    .update(articlesTable)
    .set(updateData)
    .where(eq(articlesTable.id, id))
    .returning();

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json({
    id: article.id,
    featured: article.featured,
    breakingNews: article.breakingNews,
    updatedAt: article.updatedAt.toISOString(),
  });
});

// Revert a published or scheduled article back to draft.
router.post("/admin/articles/:id/unpublish", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [article] = await db
    .update(articlesTable)
    .set({ status: "draft", scheduledAt: null })
    .where(eq(articlesTable.id, id))
    .returning();

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json({
    ...article,
    teamName: null,
    teamSlug: null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  });
});

router.post("/admin/articles/:id/schedule", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const { scheduledAt } = req.body;
  if (!scheduledAt) {
    res.status(400).json({ error: "scheduledAt is required" });
    return;
  }

  const [article] = await db
    .update(articlesTable)
    .set({ status: "scheduled", scheduledAt: new Date(scheduledAt) })
    .where(eq(articlesTable.id, id))
    .returning();

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json({
    ...article,
    teamName: null,
    teamSlug: null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  });
});

export default router;
