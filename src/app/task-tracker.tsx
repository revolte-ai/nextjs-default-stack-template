'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';

type Priority = 'low' | 'medium' | 'high';
type Filter = 'today' | 'active' | 'completed' | 'all';
type Task = {
  id: number;
  title: string;
  priority: Priority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const filters: { id: Filter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'active', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All tasks' },
];

function localDateValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatDueDate(value: string | null) {
  if (!value) return 'No date';
  const date = new Date(`${value}T12:00:00`);
  const today = localDateValue();
  if (value === today) return 'Today';
  if (value < today) return 'Overdue';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function todayLabel() {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(
    new Date()
  );
}

export default function TaskTracker({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<Filter>('today');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState(localDateValue());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const today = localDateValue();
  const todayTasks = tasks.filter(
    (task) => !task.completedAt && (!task.dueDate || task.dueDate <= today)
  );
  const todayDone = tasks.filter(
    (task) => task.completedAt && task.dueDate && task.dueDate <= today
  ).length;
  const todayTotal = todayTasks.length + todayDone;
  const completion = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'completed') return Boolean(task.completedAt);
      if (filter === 'active')
        return !task.completedAt && task.dueDate !== null && task.dueDate > today;
      if (filter === 'today') return !task.completedAt && (!task.dueDate || task.dueDate <= today);
      return true;
    });
  }, [filter, tasks, today]);

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, dueDate: dueDate || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not add the task.');

      setTasks((current) => [{ ...result, completedAt: result.completedAt ?? null }, ...current]);
      setTitle('');
      setPriority('medium');
      setDueDate(localDateValue());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not add the task. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task: Task) {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completedAt }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not update the task.');
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, ...result } : item))
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not update the task. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    setError('');
    setBusy(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? 'Could not delete the task.');
      }
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not delete the task. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Daybook home">
          <span className="wordmark-mark" aria-hidden="true">
            d.
          </span>
          <span>daybook</span>
        </Link>
        <div className="topbar-note">
          <span className="status-dot" /> A little more room to think
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Task views">
          <div className="sidebar-heading">YOUR DAY</div>
          <nav className="filter-list">
            {filters.map((item) => {
              const count =
                item.id === 'today'
                  ? todayTasks.length
                  : item.id === 'active'
                    ? tasks.filter(
                        (task) => !task.completedAt && task.dueDate && task.dueDate > today
                      ).length
                    : item.id === 'completed'
                      ? tasks.filter((task) => task.completedAt).length
                      : tasks.length;
              return (
                <button
                  className={`filter-button ${filter === item.id ? 'is-selected' : ''}`}
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  aria-current={filter === item.id ? 'page' : undefined}
                >
                  <span className="filter-icon" aria-hidden="true">
                    {item.id === 'today'
                      ? '◷'
                      : item.id === 'active'
                        ? '↗'
                        : item.id === 'completed'
                          ? '✓'
                          : '≡'}
                  </span>
                  <span>{item.label}</span>
                  <span className="filter-count">{count}</span>
                </button>
              );
            })}
          </nav>
          <div className="sidebar-footer">
            <span className="sidebar-footer-mark" aria-hidden="true">
              ✳
            </span>
            <p>
              Small steps still
              <br />
              move you forward.
            </p>
          </div>
        </aside>

        <section className="main-panel" aria-labelledby="page-title">
          <div className="date-label">{todayLabel()}</div>
          <div className="page-heading-row">
            <div>
              <p className="eyebrow">A FRESH PAGE</p>
              <h1 id="page-title">
                {filter === 'today'
                  ? 'Today, in focus.'
                  : filters.find((item) => item.id === filter)?.label}
              </h1>
            </div>
            <div
              className="progress-summary"
              aria-label={`${completion}% of today's tasks complete`}
            >
              <div
                className="progress-ring"
                style={{ '--progress': `${completion}%` } as CSSProperties}
              >
                <span>
                  {completion}
                  <small>%</small>
                </span>
              </div>
              <div className="progress-caption">
                DAY IN
                <br />
                MOTION
              </div>
            </div>
          </div>

          <div className="focus-line" aria-hidden="true">
            <span style={{ width: `${completion}%` }} />
          </div>
          <p className="task-summary">
            {todayTotal === 0
              ? 'A clear page. Start with one thing.'
              : `${todayDone} of ${todayTotal} ${todayTotal === 1 ? 'task' : 'tasks'} finished today`}
          </p>

          <form className="task-form" onSubmit={submitTask}>
            <label className="sr-only" htmlFor="task-title">
              Task title
            </label>
            <input
              autoComplete="off"
              id="task-title"
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs your attention?"
              value={title}
              required
            />
            <div className="form-options">
              <label className="sr-only" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                onChange={(event) => setPriority(event.target.value as Priority)}
                value={priority}
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <label className="sr-only" htmlFor="task-due-date">
                Due date
              </label>
              <input
                aria-label="Due date"
                id="task-due-date"
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
              <button className="add-button" disabled={busy || !title.trim()} type="submit">
                <span aria-hidden="true">+</span> Add task
              </button>
            </div>
          </form>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <div className="list-heading">
            <h2>{filters.find((item) => item.id === filter)?.label}</h2>
            <span>
              {visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {visibleTasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">
                ✳
              </span>
              <h3>{filter === 'today' ? 'Nothing pressing right now.' : 'It’s quiet here.'}</h3>
              <p>
                {filter === 'completed'
                  ? 'Finished tasks will gather here.'
                  : 'Add a task above and give it a place in your day.'}
              </p>
            </div>
          ) : (
            <ul className="task-list" aria-live="polite">
              {visibleTasks.map((task) => (
                <li className={`task-row ${task.completedAt ? 'is-complete' : ''}`} key={task.id}>
                  <button
                    aria-label={
                      task.completedAt ? `Reopen ${task.title}` : `Complete ${task.title}`
                    }
                    aria-pressed={Boolean(task.completedAt)}
                    className="completion-button"
                    disabled={busy}
                    onClick={() => void toggleTask(task)}
                    type="button"
                  >
                    {task.completedAt && <span aria-hidden="true">✓</span>}
                  </button>
                  <div className="task-copy">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta">
                      <span className={`priority-dot priority-${task.priority}`} />
                      <span>{task.priority} priority</span>
                      <span className="meta-divider">·</span>
                      <span
                        className={
                          task.dueDate && task.dueDate < today && !task.completedAt ? 'overdue' : ''
                        }
                      >
                        {formatDueDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                  <button
                    aria-label={`Delete ${task.title}`}
                    className="delete-button"
                    disabled={busy}
                    onClick={() => void deleteTask(task)}
                    type="button"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <footer className="panel-footer">One thing at a time is still progress.</footer>
        </section>
      </div>
    </main>
  );
}
