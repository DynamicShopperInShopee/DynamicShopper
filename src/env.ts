import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: {
		schema: (value) => value,
		description: 'Local SQLite connection string. Not required when using a D1 binding.'
	},
	ORIGIN: {
		schema: (value) => value,
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		schema: (value) => value,
		description:
			'Secret used to sign tokens. For production use 32 characters generated with high entropy. See [Better Auth installation](https://www.better-auth.com/docs/installation).'
	}
});
