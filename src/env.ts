import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	ASSISTANT_LOCAL: {
		schema: (value) => value,
		description: 'Enable assistant for local preview only.'
	},
	OPENAI_API_KEY: {
		schema: (value) => value,
		description: 'Optional private OpenAI API key for the local development assistant.'
	},
	OPENAI_MODEL: {
		schema: (value) => value,
		description: 'Optional model name for the local development assistant.'
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
