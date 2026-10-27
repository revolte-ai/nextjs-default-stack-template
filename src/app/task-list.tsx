'use client';

import { useState, useTransition } from 'react';
import { createTask, deleteTask, toggleTask } from './actions';

type Task = {
  id: number;
  title: string;
  completed: boolean;
};

type TaskListProps = {
  initialTasks: Task[];
};

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const completedCount = tasks.filter((task) => task.completed).length;

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    startTransition(async () => {
      const result = await createTask(title);
      if (!result.success) {
        setError(result.error);
        return;
      }

      const newTask = {
        id: result.id,
        title: title.trim(),
        completed: false,
      };
      setTasks((currentTasks) => [newTask, ...currentTasks]);
      setTitle('');
    });
  }

  function handleToggle(task: Task) {
    setError('');
    const nextCompleted = !task.completed;
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id ? { ...currentTask, completed: nextCompleted } : currentTask,
      ),
    );

    startTransition(async () => {
      const result = await toggleTask(task.id, nextCompleted);
      if (!result.success) {
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) =>
            currentTask.id === task.id ? { ...currentTask, completed: task.completed } : currentTask,
          ),
        );
        setError(result.error);
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
        setError(result.error);
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
        <div className="progress-mark" aria-label={`${completedCount} of ${tasks.length} tasks complete`}>
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
        <span>{tasks.length === 0 ? 'Nothing here yet' : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}</span>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-symbol" aria-hidden="true">—</span>
          <p>Your list is clear.</p>
          <span>Start with one small thing above.</span>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={`task-row${task.completed ? ' is-complete' : ''}`}>
              <button
                type="button"
                className="task-check"
                onClick={() => handleToggle(task)}
                aria-label={task.completed ? `Mark “${task.title}” as active` : `Mark “${task.title}” as complete`}
                aria-pressed={task.completed}
                disabled={isPending}
              >
                <span aria-hidden="true">{task.completed ? '✓' : ''}</span>
              </button>
              <span className="task-title">{task.title}</span>
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
