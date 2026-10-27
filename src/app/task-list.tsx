'use client';

import { useState, useTransition } from 'react';
import { createTask, deleteTask, updateTaskStatus } from './actions';

type TaskStatus = 'todo' | 'in_progress' | 'complete';

type Task = {
  id: number;
  title: string;
  status: TaskStatus;
};

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
};

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'complete',
  complete: 'todo',
};

type TaskListProps = {
  initialTasks: Task[];
};

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const completedCount = tasks.filter((task) => task.status === 'complete').length;

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    startTransition(async () => {
      const result = await createTask(title);
      if (!result.success || result.id === undefined) {
        setError(result.error ?? 'Something went wrong. Try again.');
        return;
      }

      const newTask = {
        id: result.id,
        title: title.trim(),
        status: 'todo' as const,
      };
      setTasks((currentTasks) => [newTask, ...currentTasks]);
      setTitle('');
    });
  }

  function handleToggle(task: Task) {
    setError('');
    const status = nextStatus[task.status];
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id ? { ...currentTask, status } : currentTask
      )
    );

    startTransition(async () => {
      const result = await updateTaskStatus(task.id, status);
      if (!result.success) {
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) =>
            currentTask.id === task.id ? { ...currentTask, status: task.status } : currentTask
          )
        );
        setError(result.error ?? 'Something went wrong. Try again.');
      }
    });
  }

  function handleDelete(task: Task) {
    setError('');
    setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id));

    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.success) {
        setTasks((currentTasks) => [task, ...currentTasks]);
        setError(result.error ?? 'Something went wrong. Try again.');
      }
    });
  }

  return (
    <section className="task-shell" aria-labelledby="task-list-heading">
      <div className="task-intro">
        <div>
          <p className="eyebrow">Today&apos;s list</p>
          <h1 id="task-list-heading">Make room for what matters.</h1>
          <p className="intro-copy">A quiet place to capture the next thing, then let it go.</p>
        </div>
        <div
          className="progress-mark"
          aria-label={`${completedCount} of ${tasks.length} tasks complete`}
        >
          <span>{String(completedCount).padStart(2, '0')}</span>
          <small>done</small>
        </div>
      </div>

      <form className="task-form" onSubmit={handleCreate}>
        <label htmlFor="task-title">What needs doing?</label>
        <div className="task-input-row">
          <input
            id="task-title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Write a task…"
            maxLength={200}
            aria-describedby={error ? 'task-error' : undefined}
            disabled={isPending}
          />
          <button type="submit" disabled={isPending || title.trim().length === 0}>
            {isPending ? 'Saving…' : 'Add task'}
          </button>
        </div>
        {error && (
          <p id="task-error" className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="task-list-heading">
        <h2>Open threads</h2>
        <span>
          {tasks.length === 0
            ? 'Nothing here yet'
            : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-symbol" aria-hidden="true">
            —
          </span>
          <p>Your list is clear.</p>
          <span>Start with one small thing above.</span>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={`task-row status-${task.status}`}>
              <button
                type="button"
                className="task-check"
                onClick={() => handleToggle(task)}
                aria-label={`Mark “${task.title}” as ${statusLabels[nextStatus[task.status]].toLowerCase()}`}
                aria-pressed={task.status === 'complete'}
                disabled={isPending}
              >
                <span aria-hidden="true">
                  {task.status === 'complete' ? '✓' : task.status === 'in_progress' ? '·' : ''}
                </span>
              </button>
              <span className="task-title">
                {task.title}
                <small className="task-status">{statusLabels[task.status]}</small>
              </span>
              <button
                type="button"
                className="task-delete"
                onClick={() => handleDelete(task)}
                aria-label={`Delete “${task.title}”`}
                disabled={isPending}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
