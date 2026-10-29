CREATE TABLE `tasks` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `status` text DEFAULT 'todo' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
