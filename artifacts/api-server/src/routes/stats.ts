import { Router, type IRouter } from "express";
import { db, articlesTable, teamsTable } from "@workspace/db";
import { eq, desc, count, sum } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [totalResult, publishedResult, draftResult, scheduledResult, teamsResult, viewsResult] = await Promise.all([
    db.select({ count: count() }).from(articlesTable),
    db.select({ count: count() }).from(articlesTable).where(eq(articlesTable.status, "published")),
    db.select({ count: count() }).from(articlesTable).where(eq(articlesTable.status, "draft")),
    db.select({ count: count() }).from(articlesTable).where(eq(articlesTable.status, "scheduled")),
    db.select({ count: count() }).from(teamsTable),
    db.select({ total: sum(articlesTable.viewCount) }).from(articlesTable),
  ]);

  const recentArticles = await db
    .select({
      id: articlesTable.id,
      title: articlesTable.title,
      slug: articlesTable.slug,
      excerpt: articlesTable.excerpt,
      content: articlesTable.content,
      coverImage: articlesTable.coverImage,
      status: articlesTable.status,
      featured: articlesTable.featured,
      breakingNews: articlesTable.breakingNews,
      category: articlesTable.category,
      authorName: articlesTable.authorName,
      teamId: articlesTable.teamId,
      sourceUrl: articlesTable.sourceUrl,
      sourceName: articlesTable.sourceName,
      publishedAt: articlesTable.publishedAt,
      scheduledAt: articlesTable.scheduledAt,
      viewCount: articlesTable.viewCount,
      createdAt: articlesTable.createdAt,
      updatedAt: articlesTable.updatedAt,
    })
    .from(articlesTable)
    .orderBy(desc(articlesTable.createdAt))
    .limit(5);

  res.json({
    totalArticles: Number(totalResult[0]?.count ?? 0),
    publishedArticles: Number(publishedResult[0]?.count ?? 0),
    draftArticles: Number(draftResult[0]?.count ?? 0),
    scheduledArticles: Number(scheduledResult[0]?.count ?? 0),
    totalTeams: Number(teamsResult[0]?.count ?? 0),
    totalViews: Number(viewsResult[0]?.total ?? 0),
    recentArticles: recentArticles.map(a => ({
      ...a,
      teamName: null,
      teamSlug: null,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      scheduledAt: a.scheduledAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
});

export default router;
