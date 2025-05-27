import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

export async function runMigrations() {
  const db = new Database("sqlite.db");
  const migrationDir = "./drizzle/migrations";
  const migrationFiles = fs.readdirSync(migrationDir);

  for (const file of migrationFiles) {
    if (!file.endsWith(".sql")) continue; // Only run .sql files
    const filePath = path.join(migrationDir, file);
    if (fs.statSync(filePath).isDirectory()) continue; // Skip directories
    const sql = fs.readFileSync(filePath, "utf8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      console.log("Running statement:", stmt.slice(0, 100)); // Log first 100 chars
      if (stmt) db.prepare(stmt).run();
    }
    console.log(`✅ Ran migration: ${file}`);
  }
}
