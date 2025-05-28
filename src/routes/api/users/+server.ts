import { drizzleDb } from "$lib/db";
import { users } from "$lib/db/schema";
import { json } from "@sveltejs/kit";

export async function GET() {
  try {
    const allUsers = await drizzleDb.select().from(users);
    return json(allUsers);
  } catch (e) {
    console.error("USERS GET error", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
