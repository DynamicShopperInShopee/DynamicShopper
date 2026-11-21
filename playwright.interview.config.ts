import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './src',
	use: { baseURL: 'http://127.0.0.1:4186', channel: 'chrome' },
	webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4186', port: 4186 },
	testMatch: '**/interview*.e2e.ts'
});
