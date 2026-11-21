import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import cloudflare from '@sveltejs/adapter-cloudflare';
import node from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

const workerBuild = process.env.DEPLOY_TARGET === 'cloudflare';
const adapter = workerBuild ? cloudflare() : node();

export default defineConfig({
	define: { 'import.meta.env.D1_WORKER': JSON.stringify(workerBuild) },
	plugins: [
		tailwindcss(),
		workerBuild && {
			name: 'exclude-local-worker-vars',
			apply: 'build',
			generateBundle: {
				order: 'post',
				handler(_options, bundle) {
					// Wrangler emits local preview bindings here before the adapter copies the server.
					delete bundle['.dev.vars'];
				}
			}
		},
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// Select Node for local SQLite development and Cloudflare for D1 deployments.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
