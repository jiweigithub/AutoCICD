import { pgTable, uuid, varchar, integer, numeric, timestamp } from 'drizzle-orm/pg-core';

export const testSuites = pgTable('test_suites', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').notNull(),
  testType: varchar('test_type', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const testCases = pgTable('test_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  suiteId: uuid('suite_id').notNull().references(() => testSuites.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const testRuns = pgTable('test_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  suiteId: uuid('suite_id').notNull().references(() => testSuites.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  coverage: numeric('coverage', { precision: 5, scale: 2 }).notNull().default('0'),
});
