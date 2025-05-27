import { drizzleDb } from "$lib/db";
import { tasks, task_status } from "$lib/db/schema";
import { json } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";

export async function GET({ url }) {
  const date =
    url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  try {
    const result = await drizzleDb
      .select({
        id: tasks.id,
        title: tasks.title,
        isCompleted: task_status.isCompleted,
      })
      .from(tasks)
      .leftJoin(
        task_status,
        and(eq(tasks.id, task_status.task_id), eq(task_status.date, date))
      );
    return json(result);
  } catch (e) {
    console.error("GET error", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST({ request }) {
  const { title, date } = await request.json();
  if (!title) return json({ error: "Title is required" }, { status: 400 });
  const taskDate = date ?? new Date().toISOString().split("T")[0];

  try {
    const [task] = await drizzleDb.insert(tasks).values({ title }).returning();
    await drizzleDb
      .insert(task_status)
      .values({ task_id: task.id, date: taskDate, isCompleted: false });
    return json({ success: true });
  } catch (e) {
    console.error("POST error", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT({ request }) {
  const { id, isCompleted, date } = await request.json();
  if (!id) return json({ error: "ID is required" }, { status: 400 });
  const taskDate = date ?? new Date().toISOString().split("T")[0];

  try {
    const existing = await drizzleDb
      .select()
      .from(task_status)
      .where(and(eq(task_status.task_id, id), eq(task_status.date, taskDate)));
    if (existing.length) {
      await drizzleDb
        .update(task_status)
        .set({ isCompleted })
        .where(
          and(eq(task_status.task_id, id), eq(task_status.date, taskDate))
        );
    } else {
      await drizzleDb
        .insert(task_status)
        .values({ task_id: id, date: taskDate, isCompleted });
    }
    return json({ success: true });
  } catch (e) {
    console.error("PUT error", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE({ request }) {
  const { id } = await request.json();
  if (!id) return json({ error: "ID is required" }, { status: 400 });

  try {
    // Delete task_status rows first, then the task
    await drizzleDb.delete(task_status).where(eq(task_status.task_id, id));
    await drizzleDb.delete(tasks).where(eq(tasks.id, id));
    return json({ success: true });
  } catch (e) {
    console.error("DELETE error", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
