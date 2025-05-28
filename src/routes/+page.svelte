<script lang="ts">
  import { onMount } from "svelte";

  let tasks = [];
  let users = [];
  let statuses = [];
  let newTask = "";
  let date = new Date().toISOString().split("T")[0];

  $: isToday = date === new Date().toISOString().split("T")[0];

  let user = null;
  let username = "";
  let password = "";
  let isLogin = true;

  async function handleAuth() {
    const res = await fetch(`/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        mode: isLogin ? "login" : "signup",
      }),
    });

    const data = await res.json();
    if (data.user) {
      user = data.user;
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      alert(data.error);
    }
  }
  function logout() {
    user = null;
    localStorage.removeItem("user");
  }
  async function fetchTasks() {
    if (!user) return;
    const res = await fetch(`/api/tasks?date=${date}&user_id=${user.id}`);
    const data = await res.json();
    tasks = data.tasks;
    statuses = data.statuses;
  }

  async function addTask() {
    if (!newTask.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask, date, user_id: user.id }),
    });
    newTask = "";
    await fetchTasks();
  }

  async function toggleTask(id: number, isCompleted: boolean) {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        isCompleted: !isCompleted,
        date,
        user_id: user.id,
      }),
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

  async function fetchUsers() {
    const res = await fetch("/api/users");
    users = await res.json();
  }
  onMount(fetchUsers);

  // Helper to get username by id
  function getUsername(id) {
    const user = users.find((u) => u.id === id);
    return user ? user.username : "";
  }

  // Fetch tasks on mount (client only)
  onMount(() => {
    const u = localStorage.getItem("user");
    if (u) user = JSON.parse(u);
    fetchTasks();
  });

  // Fetch tasks when date changes (client only)
  $: if (typeof window !== "undefined" && date) {
    fetchTasks();
  }
</script>

{#if !user}
  <form on:submit|preventDefault={handleAuth} class="mb-4">
    <input
      bind:value={username}
      placeholder="Username"
      required
      class="border p-2 mr-2"
    />
    <input
      type="password"
      bind:value={password}
      placeholder="Password"
      required
      class="border p-2 mr-2"
    />
    <button type="submit" class="bg-blue-500 text-white px-4 py-2"
      >{isLogin ? "Log In" : "Sign Up"}</button
    >
    <button
      type="button"
      on:click={() => (isLogin = !isLogin)}
      class="ml-2 underline text-blue-700"
    >
      {isLogin ? "Need an account?" : "Already have an account?"}
    </button>
  </form>
{:else}
  <div class="mb-4 flex items-center gap-4">
    <span class="font-semibold">Logged in as: {user.username}</span>
    <button on:click={logout} class="bg-gray-300 px-3 py-1 rounded"
      >Log out</button
    >
  </div>

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
          checked={statuses.find(
            (s) => s.task_id === task.id && s.user_id === user.id
          )?.isCompleted}
          on:change={() => toggleTask(task.id /* ... */)}
        />
        {task.title}
        <span>
          added by {getUsername(task.creator_id)}
          {#if statuses.filter((s) => s.task_id === task.id && s.isCompleted).length}
            , marked as completed by
            {#each statuses.filter((s) => s.task_id === task.id && s.isCompleted) as s, i}
              {getUsername(s.user_id)}{i <
              statuses.filter((ss) => ss.task_id === task.id && ss.isCompleted)
                .length -
                1
                ? ", "
                : ""}
            {/each}
          {/if}
        </span>
        <button
          on:click={() => {
            if (window.confirm("Are you sure you want to delete this task?")) {
              deleteTask(task.id);
            }
          }}
          class="text-red-500 ml-auto"
          aria-label="Delete"
          disabled={!isToday}
        >
          ✕
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .line-through {
    text-decoration: line-through;
  }
</style>
