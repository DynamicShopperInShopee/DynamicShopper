import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4183';

export default defineConfig({
	testMatch: '**/local-assistant.live.ts',
	use: { baseURL },
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 4183 --strictPort',
		url: baseURL,
		reuseExistingServer: false,
		env: { OPENAI_API_KEY: '', OPENAI_MODEL: '' }
	}
});
