import { useEffect, useMemo, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { createTask, deleteTask, getTasks, updateTask } from "./api";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("");

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("medium");

  const params = useMemo(
    () => ({ search, filter, priority }),
    [search, filter, priority]
  );

  async function load() {
    setStatus("Loading...");
    try {
      const data = await getTasks(params);
      setTasks(data);
      setStatus("");
    } catch {
      setStatus("Failed to load tasks (is backend running on :5000?).");
    }
  }

  useEffect(() => {
    load();
  }, [params]);

  const onAdd = async (body) => {
    try {
      await createTask(body);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const onToggle = async (t) => {
    await updateTask(t._id, { completed: !t.completed });
    await load();
  };

  const onDelete = async (id) => {
    await deleteTask(id);
    await load();
  };

  const openEdit = (t) => {
    setEditTask(t);
    setEditTitle(t.title);
    setEditPriority(t.priority || "medium");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editTask) return;
    const title = editTitle.trim();
    if (!title) return alert("Title can't be empty.");

    await updateTask(editTask._id, { title, priority: editPriority });
    setEditOpen(false);
    setEditTask(null);
    await load();
  };

  return (
    <div className="container">
      <header className="top">
        <div className="titleBlock">
          <h1>Task Manager</h1>
        </div>

        <button className="ghost" onClick={load}>Refresh</button>
      </header>

      <TaskForm onAdd={onAdd} />

      <div className="card controls">
        <input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>

        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="all">All priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="status">{status}</div>

      <TaskList
        tasks={tasks}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={openEdit}
      />

      {editOpen && (
        <div className="backdrop" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <b>Edit task</b>
              <button className="ghost" onClick={() => setEditOpen(false)}>Close</button>
            </div>

            <div className="modalBody">
              <div className="row">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Task title"
                  autoFocus
                />

                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="modalFoot">
              <button className="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
