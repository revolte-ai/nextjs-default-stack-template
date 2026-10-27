# Task List Feature Implementation Plan

## Overview

Add a simple, single-user task list to the existing Next.js application. Users will be able to create tasks, mark them complete, and delete them. Task data must persist in SQLite through the existing Drizzle ORM setup.

## Scope

### Included

- Create, read, update-completion, and delete operations for tasks
- SQLite persistence through Drizzle ORM
- Server-side validation with Zod
- A responsive task-list interface
- Empty, loading, error, success, completed, and disabled states
- Seed data for local development
- Verification of persistence across page reloads

### Excluded

- User authentication
- Multiple users or task sharing
- Task categories, priorities, due dates, or reminders
- Search, filtering, or pagination
- External integrations

## Technical Approach

Use the existing Next.js App Router, React, TypeScript, Tailwind CSS, Drizzle ORM, SQLite, and Zod dependencies. Use server-side data access for all task reads and mutations; do not rely on hardcoded data, local storage, or in-memory state.

## Data Model

Add a `tasks` table to `src/db/schema.ts` with `id`, `title`, `completed`, `createdAt`, and `updatedAt` fields. Enforce non-empty titles, default `completed` to false, and order active tasks before completed tasks.

## Implementation Tasks

1. Define the Drizzle `tasks` table and generate/apply its migration.
2. Add realistic local-development seed data in `src/db/seed.ts`.
3. Add Zod validation for task creation and completion updates.
4. Implement server-side list, create, toggle, and delete operations with explicit error handling.
5. Replace the placeholder in `src/app/page.tsx` with the task-list interface.
6. Add an input form, task rows, completion controls, delete controls, and task counts.
7. Implement empty, loading, error, success, completed, hover, focus, and disabled states.
8. Ensure keyboard accessibility, responsive layout, and existing Tailwind conventions.
9. Replace starter metadata with task-list-specific metadata.

## Verification Plan

Run formatting, linting, TypeScript type-checking, and the production build in that order. Review the final diff, start the app through the preview workflow, and verify that the page loads. Create a task, reload and confirm SQLite persistence, toggle completion, reload again, delete the task, and verify removal. Submit an empty or invalid title and confirm clear rejection. Check the empty state, disabled controls, keyboard focus, and responsive layout.

## Completion Criteria

Users can create, complete, and delete tasks through the interface; data persists through SQLite across reloads; invalid input is rejected; non-success UI states are handled; and all static, build, runtime, and persistence checks pass.
