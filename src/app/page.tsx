'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Task, TaskStatus } from '@/db/schema';

const columns: { status: TaskStatus; label: string; helper: string }[] = [
  { status: 'todo', label: 'Todo', helper: 'On your radar' },
  { status: 'in-progress', label: 'In Progress', helper: 'Making it happen' },
  { status: 'completed', label: 'Completed', helper: 'Nicely done' },
];

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${dueDate}T12:00:00`)
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(
    null
  );

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Unable to load tasks.');
        setTasks(await response.json());
      } catch {
        setFeedback({ kind: 'error', message: 'Your tasks could not be loaded. Try refreshing.' });
      } finally {
        setIsLoading(false);
      }
    }

    loadTasks();
  }, []);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === 'completed').length,
    [tasks]
  );
  const activeCount = tasks.length - completedCount;

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes, dueDate }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to create task.');

      setTasks((current) => [payload, ...current]);
      setTitle('');
      setNotes('');
      setDueDate('');
      setIsFormOpen(false);
      setFeedback({ kind: 'success', message: 'Task added to your board.' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to create task.',
      });
    }
  }

  async function updateStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    setBusyTaskId(task.id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to update task.');
      setTasks((current) => current.map((item) => (item.id === task.id ? payload : item)));
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Unable to update task.',
      });
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <main className="planner-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Taskly home">
          <span className="brand-mark">+</span>
          <span>taskly</span>
        </Link>
        <div className="topbar-meta">
          <span className="live-dot" aria-hidden="true" />
          <span>Personal workspace</span>
        </div>
      </header>

      <section className="hero-section" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Wednesday, October 29</p>
          <h1 id="page-title">
            Make space for
            <br />
            <em>good work.</em>
          </h1>
          <p className="hero-copy">
            A clear place for the things that matter today.
            <br />
            Keep it simple, keep moving.
          </p>
        </div>
        <div className="focus-card" aria-label="Today's focus summary">
          <div className="focus-card-top">
            <span>Today&apos;s focus</span>
            <span className="sparkle">✳</span>
          </div>
          <strong>
            {activeCount === 0
              ? 'All clear'
              : `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'} in motion`}
          </strong>
          <div className="focus-progress">
            <span
              style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
          <small>
            {completedCount} of {tasks.length} complete
          </small>
        </div>
      </section>

      <section className="board-toolbar" aria-label="Task board controls">
        <div>
          <h2>Your board</h2>
          <p>Move things forward, one step at a time.</p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
        >
          <span aria-hidden="true">+</span> Add task
        </button>
      </section>

      {isFormOpen && (
        <form className="task-form" onSubmit={createTask}>
          <div className="form-heading">
            <div>
              <span className="form-kicker">New task</span>
              <h2>What&apos;s on your mind?</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => setIsFormOpen(false)}
              aria-label="Close form"
            >
              ×
            </button>
          </div>
          <label>
            Title{' '}
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Prepare the launch notes"
              maxLength={120}
              required
            />
          </label>
          <div className="form-grid">
            <label>
              Notes{' '}
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="A little context, if useful"
                maxLength={500}
                rows={3}
              />
            </label>
            <label>
              Due date{' '}
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="text-button" type="button" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              Add to board
            </button>
          </div>
        </form>
      )}

      {feedback && (
        <p
          className={`feedback ${feedback.kind}`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}

      {isLoading ? (
        <div className="loading-state" role="status">
          Gathering your tasks<span>···</span>
        </div>
      ) : (
        <section className="board" aria-label="Task board">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.status);
            return (
              <div className="board-column" key={column.status}>
                <div className="column-heading">
                  <div>
                    <h3>
                      <span className={`status-dot ${column.status}`} />
                      {column.label}
                    </h3>
                    <p>{column.helper}</p>
                  </div>
                  <span className="count-badge">{columnTasks.length}</span>
                </div>
                <div className="task-list">
                  {columnTasks.length === 0 ? (
                    <div className="empty-column">
                      <span>○</span>
                      <p>Nothing here yet</p>
                      <small>Tasks will show up here</small>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <article className={`task-card ${task.status}`} key={task.id}>
                        <div className="task-card-top">
                          <span className="task-category">
                            {task.status === 'completed'
                              ? 'Finished'
                              : task.dueDate
                                ? 'Due soon'
                                : 'Task'}
                          </span>
                          <span className="task-id">#{String(task.id).padStart(3, '0')}</span>
                        </div>
                        <h4>{task.title}</h4>
                        {task.notes && <p>{task.notes}</p>}
                        <div className="task-card-footer">
                          <span className="date-label">
                            {formatDueDate(task.dueDate) ?? 'No due date'}
                          </span>
                          <select
                            value={task.status}
                            onChange={(event) =>
                              updateStatus(task, event.target.value as TaskStatus)
                            }
                            disabled={busyTaskId === task.id}
                            aria-label={`Move ${task.title}`}
                          >
                            <option value="todo">Todo</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
      <footer className="footer-note">
        <span>Three statuses. Zero noise.</span>
        <span>Built for your next good day.</span>
      </footer>
    </main>
  );
}
