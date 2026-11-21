import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { DATABASE_URL, ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { createAuth } from '#lib/server/auth.ts';
import { createDatabase } from '#lib/server/db/index.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const platformEnv = event.platform?.env;
	const db = await createDatabase(platformEnv?.DB, platformEnv?.DATABASE_URL ?? DATABASE_URL);
	const origin = platformEnv?.ORIGIN ?? ORIGIN;
	const secret = platformEnv?.BETTER_AUTH_SECRET ?? BETTER_AUTH_SECRET;
	if (!origin) throw new Error('ORIGIN must be configured for the current runtime');
	if (!secret) throw new Error('BETTER_AUTH_SECRET must be configured for the current runtime');
	const auth = createAuth(db, origin, secret);
	event.locals.auth = auth;

	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
