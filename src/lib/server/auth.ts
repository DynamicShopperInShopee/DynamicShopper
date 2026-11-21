import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import type { Database } from '#lib/server/db/index.ts';

export function createAuth(db: Database, origin: string, secret: string) {
	return betterAuth({
		baseURL: origin,
		secret,
		database: drizzleAdapter(db, { provider: 'sqlite' }),
		emailAndPassword: { enabled: true },
		plugins: [
			sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
		]
	});
}
