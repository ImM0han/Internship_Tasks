export default function TaskList({ tasks, onToggle, onDelete, onEdit }) {
  if (!tasks.length) {
    return (
      <div className="empty">
        <b>No tasks yet.</b>
        <div style={{ marginTop: 6 }}>Add your first task above ✨</div>
      </div>
    );
  }

  return (
    <div className="list">
      {tasks.map((t) => (
        <div className="item" key={t._id}>
          <div className="left">
            <label className="chk">
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => onToggle(t)}
              />
              <span className={`taskTitle ${t.completed ? "done" : ""}`}>
                {t.title}
              </span>
            </label>

            <span className={`tag ${t.priority}`}>{t.priority}</span>
          </div>

          <div className="actions">
            <button className="ghost" onClick={() => onEdit(t)}>Edit</button>
            <button className="danger" onClick={() => onDelete(t._id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
