import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
});

export const task_status = sqliteTable("task_status", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  task_id: integer("task_id")
    .notNull()
    .references(() => tasks.id),
  date: text("date").notNull(),
  isCompleted: integer("isCompleted", { mode: "boolean" }).default(false),
});
