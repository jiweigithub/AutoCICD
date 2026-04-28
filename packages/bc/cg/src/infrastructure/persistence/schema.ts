import { pgTable, uuid, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const generationTasks = pgTable('generation_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  archSpecId: uuid('arch_spec_id').notNull(),
  tddState: varchar('tdd_state', { length: 20 }).notNull().default('red'),
  worktreeRef: varchar('worktree_ref', { length: 255 }).notNull().default(''),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const generatedFiles = pgTable('generated_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => generationTasks.id, { onDelete: 'cascade' }),
  path: varchar('path', { length: 1024 }).notNull(),
  content: text('content').notNull().default(''),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const pullRequests = pgTable('pull_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => generationTasks.id, { onDelete: 'cascade' }),
  branch: varchar('branch', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
});
