import { sql } from 'drizzle-orm';
import { check, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export * from './auth.schema';

export const demoAssistantBudget = sqliteTable(
	'demo_assistant_budget',
	{
		id: text('id').primaryKey(),
		remaining: integer('remaining').notNull(),
		lastCall: real('last_call').notNull().default(0)
	},
	(table) => [check('demo_assistant_remaining_range', sql`${table.remaining} BETWEEN 0 AND 60`)]
);
