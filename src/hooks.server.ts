import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { DATABASE_URL, ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { createAuth } from '#lib/server/auth.ts';
import { createDatabase } from '#lib/server/db/index.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const platformEnv = event.platform?.env;
	const db = await createDatabase(platformEnv?.DB, platformEnv?.DATABASE_URL ?? DATABASE_URL);
	const auth = createAuth(
		db,
		platformEnv?.ORIGIN ?? ORIGIN,
		platformEnv?.BETTER_AUTH_SECRET ?? BETTER_AUTH_SECRET
	);
	event.locals.auth = auth;

	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
