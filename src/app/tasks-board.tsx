'use client';

import { useState, useTransition } from 'react';

type TaskStatus = 'todo' | 'in-progress' | 'completed';

type Task = {
  id: number;
  title: string;
  status: TaskStatus;
};

const columns: Array<{
  status: TaskStatus;
  label: string;
  description: string;
  accent: string;
}> = [
  {
    status: 'todo',
    label: 'Todo',
    description: 'Ready when you are.',
    accent: 'status-todo',
  },
  {
    status: 'in-progress',
    label: 'In progress',
    description: 'Currently on your desk.',
    accent: 'status-progress',
  },
  {
    status: 'completed',
    label: 'Completed',
    description: 'A record of your momentum.',
    accent: 'status-completed',
  },
];

async function sendTaskRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const result = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? 'Something went wrong.');
  }
}

export function TasksBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const addTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) {
      setError('Give your task a name before adding it.');
      return;
    }

    setError('');
    startTransition(async () => {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });
        const result = (await response.json()) as { task?: Task; error?: string };
        if (!response.ok || !result.task) {
          throw new Error(result.error ?? 'Unable to add this task.');
        }
        setTasks((current) => [result.task!, ...current]);
        setNewTask('');
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to add this task.');
      }
    });
  };

  const changeStatus = (id: number, status: TaskStatus) => {
    setError('');
    startTransition(async () => {
      try {
        await sendTaskRequest(`/api/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to update this task.');
      }
    });
  };

  const removeTask = (id: number) => {
    setError('');
    startTransition(async () => {
      try {
        await sendTaskRequest(`/api/tasks/${id}`, { method: 'DELETE' });
        setTasks((current) => current.filter((task) => task.id !== id));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to remove this task.');
      }
    });
  };

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="Daymark home">
          <span className="brand-mark">D</span>
          <span>daymark</span>
        </div>
        <span className="date-note">A clear place to begin</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Your daily desk</p>
          <h1 id="page-title">Make space for what matters.</h1>
          <p className="intro-copy">Capture the next right thing, then give it a place to land.</p>
        </div>
        <div className="progress-note" aria-label={`${tasks.filter((task) => task.status === 'completed').length} tasks completed`}>
          <span className="progress-number">{tasks.filter((task) => task.status === 'completed').length}</span>
          <span>done so far</span>
        </div>
      </section>

      <form className="capture-form" onSubmit={addTask}>
        <label className="sr-only" htmlFor="new-task">New task</label>
        <input
          id="new-task"
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          placeholder="What needs your attention?"
          maxLength={160}
          disabled={isPending}
        />
        <button type="submit" disabled={isPending || !newTask.trim()}>
          {isPending ? 'Saving…' : 'Add task'}
        </button>
      </form>

      {error ? <p className="error-message" role="alert">{error}</p> : null}

      <section className="board" aria-label="Tasks by status">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);
          return (
            <div className="column" key={column.status}>
              <div className="column-heading">
                <div>
                  <div className="column-title-row">
                    <span className={`status-dot ${column.accent}`} aria-hidden="true" />
                    <h2>{column.label}</h2>
                  </div>
                  <p>{column.description}</p>
                </div>
                <span className="count-badge" aria-label={`${columnTasks.length} tasks`}>{columnTasks.length}</span>
              </div>

              <div className="task-list">
                {columnTasks.length ? columnTasks.map((task) => (
                  <article className={`task-card ${task.status === 'completed' ? 'task-card-complete' : ''}`} key={task.id}>
                    <div className="task-card-content">
                      <span className={`task-indicator ${column.accent}`} aria-hidden="true" />
                      <p>{task.title}</p>
                    </div>
                    <div className="task-actions">
                      <label className="sr-only" htmlFor={`status-${task.id}`}>Change status for {task.title}</label>
                      <select
                        id={`status-${task.id}`}
                        value={task.status}
                        onChange={(event) => changeStatus(task.id, event.target.value as TaskStatus)}
                        disabled={isPending}
                      >
                        {columns.map((statusColumn) => <option value={statusColumn.status} key={statusColumn.status}>{statusColumn.label}</option>)}
                      </select>
                      <button type="button" className="delete-button" onClick={() => removeTask(task.id)} disabled={isPending} aria-label={`Remove ${task.title}`}>
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
                  </article>
                )) : (
                  <div className="empty-column">Nothing here yet.</div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <footer className="page-footer">
        <span>Three states. One clear next step.</span>
        <span>Saved automatically</span>
      </footer>
    </main>
  );
}
