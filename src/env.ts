import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	OPENAI_API_KEY: {
		schema: (value) => value,
		description:
			'Server-only OpenAI key for the optional local assistant and the bounded hosted storefront assistant.'
	},
	OPENAI_MODEL: {
		schema: (value) => value,
		description: 'Optional OpenAI model name for the local assistant.'
	},
	OPENAI_LOG_USAGE: {
		schema: (value) => value,
		description:
			'Set to 1 to log only token counts and the supported cost estimate in local development.'
	},
	DATABASE_URL: {
		schema: (value) => value,
		description: 'Local SQLite connection string for the auth demo when a D1 binding is absent.'
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
