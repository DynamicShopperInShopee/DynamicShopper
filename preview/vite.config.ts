import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	root: fileURLToPath(new URL('.', import.meta.url)),
	plugins: [svelte()],
	server: {
		host: '127.0.0.1',
		port: 5176,
		proxy: {
			'/api/catalog': {
				target: process.env.CATALOG_API_ORIGIN ?? 'http://127.0.0.1:4190',
				changeOrigin: true
			}
		},
		fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] }
	}
});
