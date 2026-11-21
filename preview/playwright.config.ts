import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: '.',
	testMatch: 'interview.e2e.ts',
	use: {
		baseURL: 'http://127.0.0.1:5176',
		headless: true,
		channel: process.env.PLAYWRIGHT_CHANNEL
	},
	webServer: {
		command: 'npm run dev:shopping',
		url: 'http://127.0.0.1:5176',
		reuseExistingServer: true
	},
	projects: [
		{ name: 'phone', use: { viewport: { width: 390, height: 844 } } },
		{ name: 'laptop', use: { viewport: { width: 1440, height: 900 } } }
	]
});
