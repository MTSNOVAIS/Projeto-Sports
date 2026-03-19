import { Router, type IRouter } from "express";
import { db, articlesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

const CATEGORIES = [
  { id: 1, name: "Transferências", slug: "transferencias" },
  { id: 2, name: "Resultados", slug: "resultados" },
  { id: 3, name: "Análise", slug: "analise" },
  { id: 4, name: "Entrevista", slug: "entrevista" },
  { id: 5, name: "Internacional", slug: "internacional" },
  { id: 6, name: "La Liga", slug: "la-liga" },
];

router.get("/categories", async (_req, res): Promise<void> => {
  const counts = await db
    .select({ category: articlesTable.category, count: count() })
    .from(articlesTable)
    .where(eq(articlesTable.status, "published"))
    .groupBy(articlesTable.category);

  const countMap = new Map(counts.map(c => [c.category, Number(c.count)]));

  const categories = CATEGORIES.map(cat => ({
    ...cat,
    articleCount: countMap.get(cat.name) ?? 0,
  }));

  res.json(categories);
});

export default router;
