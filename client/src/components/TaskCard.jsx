const NEXT = { todo: "in-progress", "in-progress": "done", done: "todo" };
const NEXT_LABEL = { todo: "Start →", "in-progress": "Complete ✓", done: "Reopen ↺" };

export default function TaskCard({ task, onEdit, onDelete, onMove }) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = due && task.status !== "done" && due < new Date(new Date().toDateString());

  return (
    <article
      className="card"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task._id)}
    >
      <div className="card-head">
        <span className={`badge ${task.priority}`}>{task.priority}</span>
        <div className="card-actions">
          <button title="Edit" onClick={() => onEdit(task)}>✏️</button>
          <button title="Delete" onClick={() => onDelete(task._id)}>🗑️</button>
        </div>
      </div>
      <h4 className={task.status === "done" ? "done-text" : ""}>{task.title}</h4>
      {task.description && <p className="desc">{task.description}</p>}
      {task.tags?.length > 0 && (
        <div className="tags">{task.tags.map((t) => <span key={t}>#{t}</span>)}</div>
      )}
      <div className="card-foot">
        {due ? (
          <span className={overdue ? "due overdue" : "due"}>
            📅 {due.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            {overdue && " · overdue"}
          </span>
        ) : <span />}
        <button className="link" onClick={() => onMove(task._id, NEXT[task.status])}>
          {NEXT_LABEL[task.status]}
        </button>
      </div>
    </article>
  );
}
