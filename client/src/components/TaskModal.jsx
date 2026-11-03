import { useEffect, useState } from "react";

export default function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task.title || "",
    description: task.description || "",
    priority: task.priority || "medium",
    status: task.status || "todo",
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    tags: (task.tags || []).join(", "),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...(task._id && { _id: task._id }),
        ...form,
        dueDate: form.dueDate || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <h2>{task._id ? "Edit task" : "New task"}</h2>
        <label>Title<input name="title" value={form.title} onChange={update} required autoFocus maxLength={120} /></label>
        <label>Description<textarea name="description" rows={3} value={form.description} onChange={update} /></label>
        <div className="row">
          <label>Priority
            <select name="priority" value={form.priority} onChange={update}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </label>
          <label>Status
            <select name="status" value={form.status} onChange={update}>
              <option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option>
            </select>
          </label>
          <label>Due date<input type="date" name="dueDate" value={form.dueDate} onChange={update} /></label>
        </div>
        <label>Tags <span className="muted">(comma separated)</span>
          <input name="tags" value={form.tags} onChange={update} placeholder="frontend, urgent" />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={saving}>{saving ? "Saving…" : "Save task"}</button>
        </div>
      </form>
    </div>
  );
}
