import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: './src',
	use: { baseURL },
	webServer: {
		command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
		url: baseURL,
		timeout: 120_000
	},
	testMatch: '**/*.e2e.{ts,js}'
});
