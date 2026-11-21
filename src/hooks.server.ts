import { error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { DATABASE_URL, ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { createAuth } from '#lib/server/auth.ts';
import { createDatabase } from '#lib/server/db/index.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const route = event.route.id;
	const isAuthDemo = route === '/demo/better-auth' || route?.startsWith('/demo/better-auth/');
	const isAuthApi = pathname === '/api/auth' || pathname.startsWith('/api/auth/');
	if (!isAuthDemo && !isAuthApi) return resolve(event);

	const platformEnv = event.platform?.env;
	const database = platformEnv?.DB;
	const databaseUrl = platformEnv?.DATABASE_URL ?? DATABASE_URL;
	const origin = platformEnv?.ORIGIN ?? ORIGIN;
	const secret = platformEnv?.BETTER_AUTH_SECRET ?? BETTER_AUTH_SECRET;
	if ((!database && !databaseUrl?.trim()) || !origin?.trim() || !secret?.trim()) {
		error(503, 'Authentication demo is unavailable');
	}

	const db = await createDatabase(database, databaseUrl);
	const auth = createAuth(db, origin, secret);
	event.locals.auth = auth;

	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
