import { pgTable, varchar, timestamp, jsonb, integer, boolean } from 'drizzle-orm/pg-core';

export const sessionsTable = pgTable('supervisor_sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  dagId: varchar('dag_id', { length: 64 }).notNull(),
  agentType: varchar('agent_type', { length: 50 }).notNull(),
  agentRole: varchar('agent_role', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  heartbeatAt: timestamp('heartbeat_at'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const executionStatesTable = pgTable('supervisor_execution_states', {
  id: varchar('id', { length: 64 }).primaryKey(),
  dagId: varchar('dag_id', { length: 64 }).notNull(),
  specId: varchar('spec_id', { length: 64 }).notNull(),
  sessionId: varchar('session_id', { length: 64 }).references(() => sessionsTable.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  attempt: integer('attempt').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  result: jsonb('result'),
  error: jsonb('error'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const dagProgressTable = pgTable('supervisor_dag_progress', {
  id: varchar('id', { length: 64 }).primaryKey(),
  dagId: varchar('dag_id', { length: 64 }).notNull().unique(),
  totalSpecs: integer('total_specs').notNull().default(0),
  completedSpecs: integer('completed_specs').notNull().default(0),
  failedSpecs: integer('failed_specs').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  completed: boolean('completed').notNull().default(false),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
