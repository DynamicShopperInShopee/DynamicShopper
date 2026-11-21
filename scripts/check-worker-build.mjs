import { readdirSync } from 'node:fs';
import { basename } from 'node:path';

for (const directory of ['.svelte-kit/output', '.svelte-kit/cloudflare']) {
	const files = readdirSync(directory, { recursive: true, encoding: 'utf8' });
	if (files.some((file) => /^(?:\.dev\.vars|\.env)(?:\.|$)/.test(basename(file)))) {
		throw new Error(`Local environment file found in ${directory}`);
	}
}
