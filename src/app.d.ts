import type { User, Session } from 'better-auth';
import type { createAuth } from './lib/server/auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			auth?: ReturnType<typeof createAuth>;
			user?: User;
			session?: Session;
		}

		// interface Error {}
		// interface PageData {}
		interface PageState {
			storeSearch?: import('./routes/search-navigation').SearchSelection | string;
		}
		interface Platform {
			env: {
				DB?: import('@cloudflare/workers-types').D1Database;
				DATABASE_URL?: string;
				ORIGIN?: string;
				BETTER_AUTH_SECRET?: string;
			};
		}
	}
}

export {};
