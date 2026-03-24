import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  sofascoreId: integer("sofascore_id").notNull().unique(),
  homeTeamName: text("home_team_name").notNull(),
  awayTeamName: text("away_team_name").notNull(),
  homeTeamSofascoreId: integer("home_team_sofascore_id"),
  awayTeamSofascoreId: integer("away_team_sofascore_id"),
  tournament: text("tournament").default("La Liga"),
  showInResults: boolean("show_in_results").notNull().default(true),
  featuredOnHome: boolean("featured_on_home").notNull().default(false),
  pinnedOrder: integer("pinned_order").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
