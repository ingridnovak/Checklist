<script lang="ts">
  import { onMount } from "svelte";

  let tasks = [];
  let newTask = "";
  let date = new Date().toISOString().split("T")[0];

  async function fetchTasks() {
    const res = await fetch(`/api/tasks?date=${date}`);
    tasks = await res.json();
  }

  async function addTask() {
    if (!newTask.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask, date }),
    });
    newTask = "";
    await fetchTasks();
  }

  async function toggleTask(id: number, isCompleted: boolean) {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isCompleted: !isCompleted, date }),
    });
    await fetchTasks();
  }

  async function deleteTask(id: number) {
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchTasks();
  }

  // Fetch tasks on mount (client only)
  onMount(fetchTasks);

  // Fetch tasks when date changes (client only)
  $: if (typeof window !== "undefined" && date) {
    fetchTasks();
  }
</script>

<h1 class="text-xl font-bold mb-4">Daily Checklist</h1>

<div class="mb-4">
  <input
    bind:value={newTask}
    placeholder="New task"
    class="border p-2 mr-2"
    on:keydown={(e) => e.key === "Enter" && addTask()}
  />
  <button on:click={addTask} class="bg-blue-500 text-white px-4 py-2">
    Add
  </button>
</div>

<div class="mb-4">
  <label for="date-input">Select date: </label>
  <input id="date-input" type="date" bind:value={date} />
</div>

<ul>
  {#each tasks as task (task.id)}
    <li class="flex items-center gap-2 mb-2">
      <input
        type="checkbox"
        checked={task.isCompleted}
        on:change={() => toggleTask(task.id, task.isCompleted)}
      />
      <span class:line-through={task.isCompleted}>{task.title}</span>
      <button
        on:click={() => deleteTask(task.id)}
        class="text-red-500 ml-auto"
        aria-label="Delete"
      >
        ✕
      </button>
    </li>
  {/each}
</ul>

<style>
  .line-through {
    text-decoration: line-through;
  }
</style>
