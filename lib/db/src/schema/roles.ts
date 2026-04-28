import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  permissions: text("permissions").array().notNull().default([]),
  system: boolean("system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Role = typeof rolesTable.$inferSelect;
export type InsertRole = typeof rolesTable.$inferInsert;
