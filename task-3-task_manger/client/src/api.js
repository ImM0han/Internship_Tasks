const API = "http://localhost:5000/api/tasks";

export async function getTasks(params = {}) {
  const url = new URL(API);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  return res.json();
}

export async function createTask(body) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error((await res.json())?.msg || "Create failed");
  return res.json();
}

export async function updateTask(id, body) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error((await res.json())?.msg || "Update failed");
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json())?.msg || "Delete failed");
  return res.json();
}
