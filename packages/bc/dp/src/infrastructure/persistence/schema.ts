import { pgTable, uuid, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const releases = pgTable('releases', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: varchar('version', { length: 50 }).notNull(),
  environment: varchar('environment', { length: 20 }).notNull(),
  artifactUrl: text('artifact_url').notNull().default(''),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  version_label: integer('version_label').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  releaseId: uuid('release_id').notNull().references(() => releases.id, { onDelete: 'cascade' }),
  stageType: varchar('stage_type', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const rollbacks = pgTable('rollbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  releaseId: uuid('release_id').notNull().references(() => releases.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  trigger: varchar('trigger', { length: 20 }).notNull().default('manual'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});
