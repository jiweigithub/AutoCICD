import { pgTable, uuid, varchar, integer, jsonb, text, timestamp } from 'drizzle-orm/pg-core';

export const architectureSpecs = pgTable('architecture_specs', {
  id: uuid('id').primaryKey().defaultRandom(),
  storyId: uuid('story_id').notNull(),
  contextMap: jsonb('context_map').notNull().default({}),
  decisions: jsonb('decisions').notNull().default([]),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const apiContracts = pgTable('api_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  specId: uuid('spec_id').notNull().references(() => architectureSpecs.id, { onDelete: 'cascade' }),
  openApiSpec: text('open_api_spec').notNull(),
  version: varchar('version', { length: 50 }).notNull().default('1.0.0'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
});
