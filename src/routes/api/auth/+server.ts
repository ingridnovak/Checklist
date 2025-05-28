import { drizzleDb } from "$lib/db";
import { users } from "$lib/db/schema";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export async function POST({ request }) {
  const { username, password, mode } = await request.json();
  if (!username || !password)
    return json({ error: "Missing fields" }, { status: 400 });

  if (mode === "signup") {
    const existing = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (existing.length) return json({ error: "User exists" }, { status: 400 });
    const [user] = await drizzleDb
      .insert(users)
      .values({ username, password })
      .returning();
    return json({ user: { id: user.id, username: user.username } });
  } else if (mode === "login") {
    const found = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (!found.length || found[0].password !== password) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }
    return json({ user: { id: found[0].id, username: found[0].username } });
  }
  return json({ error: "Invalid mode" }, { status: 400 });
}
