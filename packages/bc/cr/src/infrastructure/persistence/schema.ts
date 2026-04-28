import { pgTable, pgEnum, uuid, varchar, integer, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const severityEnum = pgEnum('severity', ['critical', 'high', 'medium', 'low', 'info']);
export const checkTypeEnum = pgEnum('check_type', ['static-analysis', 'type-check', 'lint', 'security', 'architecture', 'style-guide']);

export const reviewSessions = pgTable('review_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  prId: uuid('pr_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  findings: jsonb('findings').notNull().default([]),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reviewChecks = pgTable('review_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => reviewSessions.id, { onDelete: 'cascade' }),
  checkType: checkTypeEnum('check_type').notNull(),
  result: varchar('result', { length: 20 }).notNull().default('passed'),
});

export const violations = pgTable('violations', {
  id: uuid('id').primaryKey().defaultRandom(),
  checkId: uuid('check_id').notNull().references(() => reviewChecks.id, { onDelete: 'cascade' }),
  severity: severityEnum('severity').notNull(),
  file: varchar('file', { length: 1024 }).notNull(),
  line: integer('line').notNull().default(0),
  message: text('message').notNull(),
});
