import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { usersTable } from "./users";

export interface CoAuthorEntry {
  id?: string;
  name: string;
  email?: string;
  external?: boolean;
}

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle"),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  status: text("status").notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  breakingNews: boolean("breaking_news").notNull().default(false),
  category: text("category").notNull().default("La Liga"),
  authorName: text("author_name").notNull().default("Redação"),
  authorId: integer("author_id").references(() => usersTable.id),
  coAuthors: jsonb("co_authors").$type<CoAuthorEntry[]>().notNull().default([]),
  kind: text("kind").notNull().default("article"),
  teamId: integer("team_id").references(() => teamsTable.id),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
