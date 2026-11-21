import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4192);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	use: { baseURL },
	webServer: {
		command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
		url: baseURL,
		env: { OPENAI_API_KEY: '', OPENAI_MODEL: '' }
	},
	testMatch: '**/harness-model.local.ts'
});
