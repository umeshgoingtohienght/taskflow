import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import TaskCard from "../components/TaskCard.jsx";
import TaskModal from "../components/TaskModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const COLUMNS = [
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In progress" },
  { key: "done", label: "Done" },
];

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ search: "", priority: "", sort: "newest" });
  const [editing, setEditing] = useState(null); // null | {} (new) | task
  const [dragOver, setDragOver] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
      const [list, s] = await Promise.all([
        api(`/tasks?limit=100&${qs}`, { token }),
        api("/tasks/stats", { token }),
      ]);
      setTasks(list.tasks);
      setStats(s);
    } catch (err) {
      if (err.status === 401) logout();
      setError(err.message);
    }
  }, [filters, token, logout]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  const save = async (data) => {
    if (data._id) await api(`/tasks/${data._id}`, { method: "PATCH", body: data, token });
    else await api("/tasks", { method: "POST", body: data, token });
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this task?")) return;
    await api(`/tasks/${id}`, { method: "DELETE", token });
    load();
  };

  const moveTo = async (id, status) => {
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status } : t))); // optimistic
    try {
      await api(`/tasks/${id}`, { method: "PATCH", body: { status }, token });
    } finally {
      load();
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">✅ TaskFlow</span>
        <div className="topbar-right">
          <span className="muted">Hi, {user?.name?.split(" ")[0]}</span>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="container">
        {stats && (
          <section className="stats">
            <Stat label="Total tasks" value={stats.total} />
            <Stat label="In progress" value={stats["in-progress"]} />
            <Stat label="Completed" value={`${stats.completionRate}%`}>
              <div className="bar"><span style={{ width: `${stats.completionRate}%` }} /></div>
            </Stat>
            <Stat label="Overdue" value={stats.overdue} warn={stats.overdue > 0} />
          </section>
        )}

        <section className="toolbar">
          <input
            className="search"
            placeholder="🔍 Search tasks…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
          </select>
          <button className="btn primary" onClick={() => setEditing({})}>+ New task</button>
        </section>

        {error && <p className="error">{error}</p>}

        <section className="board">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className={`column ${dragOver === col.key ? "drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  setDragOver(null);
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveTo(id, col.key);
                }}
              >
                <h3 className={`col-title ${col.key}`}>
                  {col.label} <span className="count">{items.length}</span>
                </h3>
                {items.length === 0 && <p className="empty">Drop tasks here</p>}
                {items.map((task) => (
                  <TaskCard key={task._id} task={task} onEdit={setEditing} onDelete={remove} onMove={moveTo} />
                ))}
              </div>
            );
          })}
        </section>
      </main>

      {editing && <TaskModal task={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function Stat({ label, value, warn, children }) {
  return (
    <div className={`stat ${warn ? "warn" : ""}`}>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      {children}
    </div>
  );
}
