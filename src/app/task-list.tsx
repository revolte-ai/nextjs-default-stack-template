'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { TaskStatus } from '@/db/schema';

type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  createdAt: string;
};

type TaskListProps = {
  initialTasks: Task[];
};

const statusLabels: Record<TaskStatus, string> = {
  active: 'Active',
  'in-progress': 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusClassNames: Record<TaskStatus, string> = {
  active: 'task-row--active',
  'in-progress': 'task-row--in-progress',
  completed: 'task-row--completed',
  cancelled: 'task-row--cancelled',
};

export default function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === 'completed').length,
    [tasks]
  );

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsAdding(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? 'Unable to add that task.');
        return;
      }

      setTasks((current) => [payload.task, ...current]);
      setTitle('');
    } catch {
      setError('Unable to add that task. Check your connection and try again.');
    } finally {
      setIsAdding(false);
    }
  }

  async function updateStatus(id: number, status: TaskStatus) {
    setError('');
    setBusyId(id);

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? 'Unable to update that task.');
        return;
      }

      setTasks((current) => current.map((task) => (task.id === id ? payload.task : task)));
    } catch {
      setError('Unable to update that task. Check your connection and try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTask(id: number) {
    setError('');
    setBusyId(id);

    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      const payload = response.status === 204 ? null : await response.json();

      if (!response.ok) {
        setError(payload?.error ?? 'Unable to delete that task.');
        return;
      }

      setTasks((current) => current.filter((task) => task.id !== id));
    } catch {
      setError('Unable to delete that task. Check your connection and try again.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="task-shell" aria-labelledby="task-list-title">
      <div className="task-header">
        <div>
          <p className="eyebrow">A clear mind starts here</p>
          <h1 id="task-list-title">Today&apos;s tasks</h1>
          <p className="task-subtitle">Capture what matters. Keep moving.</p>
        </div>
        <div className="progress-note" aria-live="polite">
          <span className="progress-number">{completedCount}</span>
          <span>completed</span>
        </div>
      </div>

      <form className="add-task-form" onSubmit={addTask}>
        <label className="sr-only" htmlFor="task-title">
          New task
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs doing?"
          maxLength={200}
          disabled={isAdding}
        />
        <button type="submit" disabled={isAdding || !title.trim()}>
          {isAdding ? 'Adding…' : 'Add task'}
        </button>
      </form>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="task-list" aria-live="polite">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-mark" aria-hidden="true">
              ✦
            </span>
            <h2>Your list is clear.</h2>
            <p>Add a task above when something comes to mind.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <article className={`task-row ${statusClassNames[task.status]}`} key={task.id}>
              <div className="task-copy">
                <span className="task-dot" aria-hidden="true" />
                <h2>{task.title}</h2>
              </div>
              <div className="task-actions">
                <label className="sr-only" htmlFor={`status-${task.id}`}>
                  Status for {task.title}
                </label>
                <select
                  id={`status-${task.id}`}
                  value={task.status}
                  onChange={(event) => updateStatus(task.id, event.target.value as TaskStatus)}
                  disabled={busyId === task.id}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  disabled={busyId === task.id}
                  aria-label={`Delete ${task.title}`}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
