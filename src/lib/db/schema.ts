import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Store a hash in production!
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
});

export const task_status = sqliteTable("task_status", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  task_id: integer("task_id")
    .notNull()
    .references(() => tasks.id),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  isCompleted: integer("isCompleted", { mode: "boolean" }).default(false),
});
