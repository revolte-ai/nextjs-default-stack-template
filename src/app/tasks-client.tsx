'use client';

import { FormEvent, useMemo, useState, useTransition } from 'react';

import type { Task, TaskStatus } from '@/db/schema';

const columns: Array<{ status: TaskStatus; label: string; eyebrow: string }> = [
  { status: 'ready', label: 'Ready for development', eyebrow: 'Queue' },
  { status: 'in-progress', label: 'In-progress', eyebrow: 'Active now' },
  { status: 'completed', label: 'Completed', eyebrow: 'Shipped' },
];

const statusStyles: Record<TaskStatus, string> = {
  ready: 'status-ready',
  'in-progress': 'status-progress',
  completed: 'status-completed',
};

const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  ready: 'in-progress',
  'in-progress': 'completed',
  completed: null,
};

export function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      ready: tasks.filter((task) => task.status === 'ready').length,
      'in-progress': tasks.filter((task) => task.status === 'in-progress').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    }),
    [tasks]
  );
  const completion = tasks.length === 0 ? 0 : Math.round((counts.completed / tasks.length) * 100);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    startTransition(async () => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? 'Could not add that task.');
        return;
      }

      setTasks((current) => [result, ...current]);
      setTitle('');
      setNotice('Task added to the ready queue.');
    });
  }

  function moveTask(task: Task, status: TaskStatus) {
    setError('');
    setNotice('');

    startTransition(async () => {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? 'Could not update that task.');
        return;
      }

      setTasks((current) => current.map((item) => (item.id === task.id ? result : item)));
      setNotice(
        `Moved “${task.title}” to ${columns.find((column) => column.status === status)?.label}.`
      );
    });
  }

  return (
    <main className="tracker-shell">
      <header className="tracker-header">
        <div>
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              →
            </span>
            <span>momentum</span>
          </div>
          <p className="header-kicker">Personal delivery tracker / 01</p>
          <h1>
            Move the work
            <br />
            <em>forward.</em>
          </h1>
          <p className="header-description">
            A clear line from ready to shipped. Keep the list small, keep the signal strong.
          </p>
        </div>
        <div className="progress-panel" aria-label={`${completion}% complete`}>
          <div className="progress-panel-top">
            <span>Overall progress</span>
            <strong>{String(completion).padStart(2, '0')}%</strong>
          </div>
          <div className="progress-rail">
            <span style={{ width: `${completion}%` }} />
          </div>
          <p>
            {counts.completed} of {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} shipped
          </p>
        </div>
      </header>

      <section className="summary-strip" aria-label="Task summary">
        {columns.map((column) => (
          <div className="summary-item" key={column.status}>
            <span className={`summary-dot ${statusStyles[column.status]}`} aria-hidden="true" />
            <span>{column.label}</span>
            <strong>{counts[column.status]}</strong>
          </div>
        ))}
      </section>

      <section className="add-task-section" aria-labelledby="add-task-heading">
        <div>
          <p className="section-label">Add to the queue</p>
          <h2 id="add-task-heading">What needs moving?</h2>
        </div>
        <form className="add-task-form" onSubmit={addTask}>
          <label className="sr-only" htmlFor="task-title">
            Task title
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Write a clear, actionable task..."
            maxLength={120}
            disabled={isPending}
          />
          <button type="submit" disabled={isPending || !title.trim()}>
            {isPending ? 'Adding...' : 'Add task'} <span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>

      <div className="feedback" role="status" aria-live="polite">
        {error && <span className="feedback-error">{error}</span>}
        {!error && notice && <span>{notice}</span>}
      </div>

      <section className="board" aria-label="Task board">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);
          return (
            <section
              className="task-column"
              key={column.status}
              aria-labelledby={`${column.status}-heading`}
            >
              <div className="column-header">
                <div>
                  <p className="column-eyebrow">{column.eyebrow}</p>
                  <h2 id={`${column.status}-heading`}>{column.label}</h2>
                </div>
                <span className={`column-count ${statusStyles[column.status]}`}>
                  {String(columnTasks.length).padStart(2, '0')}
                </span>
              </div>
              <div className="task-list">
                {columnTasks.length === 0 ? (
                  <div className="empty-column">
                    No tasks here yet.
                    <br />
                    <span>Keep the momentum going.</span>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <article className="task-card" key={task.id}>
                      <div
                        className={`task-marker ${statusStyles[task.status]}`}
                        aria-hidden="true"
                      />
                      <p>{task.title}</p>
                      {nextStatus[task.status] && (
                        <button
                          className="move-button"
                          onClick={() => moveTask(task, nextStatus[task.status] as TaskStatus)}
                          disabled={isPending}
                          aria-label={`Move ${task.title} to ${nextStatus[task.status]}`}
                        >
                          <span aria-hidden="true">→</span>
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <span className="completed-mark" aria-label="Completed">
                          ✓
                        </span>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </section>

      <footer className="tracker-footer">
        <span>Momentum / Daily signal</span>
        <span>All changes saved automatically</span>
      </footer>
    </main>
  );
}
