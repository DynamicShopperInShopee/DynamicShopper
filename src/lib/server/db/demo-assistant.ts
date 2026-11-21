import { and, between, lte, sql } from 'drizzle-orm';
import createBudgetTable from '../../../../drizzle/0000_demo_assistant_budget.sql?raw';
import type { Database } from './index';
import { demoAssistantBudget as budget } from './schema';

const limit = 60;
const initialized = new WeakSet<Database>();

export async function reserveDemoCall(db: Database, now?: number) {
	if (!initialized.has(db)) {
		await db.run(sql.raw(createBudgetTable));
		initialized.add(db);
	}

	// All isolates use the database clock and claim the same persistent row in one statement.
	const clock = now ?? sql<number>`unixepoch('subsec')`;
	const claims = await db
		.insert(budget)
		.values({ id: 'public-storefront', remaining: limit - 1, lastCall: clock })
		.onConflictDoUpdate({
			target: budget.id,
			set: { remaining: sql`${budget.remaining} - 1`, lastCall: clock },
			setWhere: and(between(budget.remaining, 1, limit), lte(budget.lastCall, sql`${clock} - 3`))
		})
		.returning({ remaining: budget.remaining });
	return claims.length === 1;
}
