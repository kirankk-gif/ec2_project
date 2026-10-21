import { useEffect, useMemo, useState } from "react";
import { Check, Circle, ClipboardList, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";

const API = "/api/tasks";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load tasks.");
      setTasks(data);
    } catch (err) {
      setError(`${err.message} Make sure the backend and MongoDB are running.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function addTask(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleanTitle })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create task.");
      setTasks((current) => [data, ...current]);
      setTitle("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    setError("");
    try {
      const response = await fetch(`${API}/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update task.");
      setTasks((current) => current.map((item) => item._id === data._id ? data : item));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(id) {
    setError("");
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not delete task.");
      }
      setTasks((current) => current.filter((task) => task._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  }), [tasks, filter]);

  return (
    <main className="page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Task Manager home">
          <span className="brand-icon"><ClipboardList size={21} /></span>
          <span>task<span className="brand-light">flow</span></span>
        </a>
        <span className="top-tag"><span className="status-dot" /> DEVOPS PRACTICE PROJECT</span>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Make room for<br /><span>what matters.</span></h1>
        <p className="hero-copy">Small steps. Clear priorities. One task at a time.</p>
      </section>

      <section className="workspace">
        <div className="summary">
          <div>
            <p className="section-kicker">TASK OVERVIEW</p>
            <h2>Your tasks <span className="count">{tasks.length}</span></h2>
          </div>
          <div className="progress-summary">
            <div className="progress-label"><span>Progress</span><strong>{tasks.length ? Math.round(completedCount / tasks.length * 100) : 0}%</strong></div>
            <div className="progress-track"><span style={{ width: `${tasks.length ? completedCount / tasks.length * 100 : 0}%` }} /></div>
          </div>
        </div>

        <form className="add-form" onSubmit={addTask}>
          <Plus size={20} className="input-plus" />
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="What needs to get done?" aria-label="New task title" />
          <button className="add-button" type="submit" disabled={saving || !title.trim()}>
            {saving ? <LoaderCircle className="spin" size={17} /> : <Plus size={17} />} Add task
          </button>
        </form>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <div className="list-heading">
          <h3>Task list</h3>
          <button className="refresh-button" onClick={loadTasks} type="button" title="Refresh tasks" aria-label="Refresh tasks"><RefreshCw size={16} /></button>
        </div>
        <div className="filters" role="group" aria-label="Filter tasks">
          {["all", "active", "completed"].map((item) => (
            <button key={item} className={`filter ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)} type="button">
              {item[0].toUpperCase() + item.slice(1)}
              {item === "all" && <span>{tasks.length}</span>}
            </button>
          ))}
        </div>

        <div className="task-list">
          {loading ? (
            <div className="empty-state"><LoaderCircle className="spin" size={25} /><p>Loading your tasks…</p></div>
          ) : visibleTasks.length === 0 ? (
            <div className="empty-state"><ClipboardList size={30} /><strong>{filter === "completed" ? "No completed tasks yet" : filter === "active" ? "You're all caught up" : "A fresh start"}</strong><p>{filter === "all" ? "Add your first task above to get moving." : "Try another filter or add a new task."}</p></div>
          ) : visibleTasks.map((task) => (
            <article className={`task-row ${task.completed ? "is-complete" : ""}`} key={task._id}>
              <button className="check-button" type="button" onClick={() => toggleTask(task)} aria-label={task.completed ? "Mark task active" : "Mark task complete"}>
                {task.completed ? <Check size={17} /> : <Circle size={20} />}
              </button>
              <div className="task-content">
                <p className="task-title">{task.title}</p>
                <span className="task-status">{task.completed ? "COMPLETED" : "IN PROGRESS"}</span>
              </div>
              <button className="delete-button" type="button" onClick={() => deleteTask(task._id)} aria-label={`Delete ${task.title}`} title="Delete task"><Trash2 size={17} /></button>
            </article>
          ))}
        </div>
        <footer className="list-footer"><span>{completedCount} of {tasks.length} completed</span><span>Stored in MongoDB</span></footer>
      </section>

      <footer className="page-footer">BUILT TO LEARN · DEPLOYED TO GROW</footer>
    </main>
  );
}
