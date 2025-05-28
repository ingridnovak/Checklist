import { drizzleDb } from "$lib/db";
import { tasks, task_status, users } from "$lib/db/schema";
import { json } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";

// GET: fetch tasks for a user and date
export async function GET({ url }) {
  const date =
    url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  try {
    // Get all tasks
    const tasksResult = await drizzleDb
      .select({
        id: tasks.id,
        title: tasks.title,
        creator_id: tasks.user_id,
      })
      .from(tasks);

    // Get all completion statuses for this date
    const statuses = await drizzleDb
      .select({
        task_id: task_status.task_id,
        user_id: task_status.user_id,
        isCompleted: task_status.isCompleted,
      })
      .from(task_status)
      .where(eq(task_status.date, date));

    return json({ tasks: tasksResult, statuses });
  } catch (e) {
    console.error("GET error", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
// POST: create a new task for a user
export async function POST({ request }) {
  const { title, date, user_id } = await request.json();
  if (!title || !user_id)
    return json({ error: "Missing fields" }, { status: 400 });
  const taskDate = date ?? new Date().toISOString().split("T")[0];

  try {
    const [task] = await drizzleDb
      .insert(tasks)
      .values({ title, user_id })
      .returning();
    await drizzleDb.insert(task_status).values({
      task_id: task.id,
      user_id,
      date: taskDate,
      isCompleted: false,
    });
    return json({ success: true });
  } catch (e) {
    console.error("POST error", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: update completion status for a user's task on a date
export async function PUT({ request }) {
  const { id, isCompleted, date, user_id } = await request.json();
  if (!id || !user_id)
    return json({ error: "Missing fields" }, { status: 400 });
  const taskDate = date ?? new Date().toISOString().split("T")[0];

  try {
    const existing = await drizzleDb
      .select()
      .from(task_status)
      .where(
        and(
          eq(task_status.task_id, id),
          eq(task_status.date, taskDate),
          eq(task_status.user_id, user_id)
        )
      );
    if (existing.length) {
      await drizzleDb
        .update(task_status)
        .set({ isCompleted })
        .where(
          and(
            eq(task_status.task_id, id),
            eq(task_status.date, taskDate),
            eq(task_status.user_id, user_id)
          )
        );
    } else {
      await drizzleDb
        .insert(task_status)
        .values({ task_id: id, user_id, date: taskDate, isCompleted });
    }
    return json({ success: true });
  } catch (e) {
    console.error("PUT error", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: delete a task and all its statuses for a user
export async function DELETE({ request }) {
  const { id, user_id } = await request.json();
  if (!id || !user_id)
    return json({ error: "Missing fields" }, { status: 400 });

  try {
    await drizzleDb
      .delete(task_status)
      .where(
        and(eq(task_status.task_id, id), eq(task_status.user_id, user_id))
      );
    await drizzleDb.delete(tasks).where(eq(tasks.id, id));
    return json({ success: true });
  } catch (e) {
    console.error("DELETE error", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
