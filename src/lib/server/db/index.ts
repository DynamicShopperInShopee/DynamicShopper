import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import * as schema from './schema';

export type Database = ReturnType<typeof drizzleD1<typeof schema>>;

const d1Clients = new WeakMap<D1Database, Database>();
const sqliteClients = new Map<string, Promise<Database>>();

export async function createDatabase(
	database: D1Database | undefined,
	databaseUrl: string | undefined
) {
	if (database) {
		let client = d1Clients.get(database);
		if (!client) {
			client = drizzleD1(database, { schema });
			d1Clients.set(database, client);
		}
		return client;
	}

	if (!databaseUrl) throw new Error('DATABASE_URL is required when a D1 binding is not configured');
	let client = sqliteClients.get(databaseUrl);
	if (!client) {
		client = Promise.all([import('drizzle-orm/better-sqlite3'), import('better-sqlite3')]).then(
			([{ drizzle }, { default: BetterSqlite3 }]) =>
				drizzle(new BetterSqlite3(databaseUrl), { schema }) as unknown as Database
		);
		sqliteClients.set(databaseUrl, client);
	}
	return client;
}
