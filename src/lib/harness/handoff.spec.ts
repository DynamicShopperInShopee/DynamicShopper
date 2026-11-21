import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as api from './index.ts';

const doc = readFileSync(
	new URL('../../../docs/handoff/codex-ui-wiring.md', import.meta.url),
	'utf8'
);

describe('R19 · the Codex hand-off prompt matches the code', () => {
	it('every runtime export the prompt imports exists in the public API', () => {
		const block =
			/import \{([^}]+)\} from '#lib\/personalization\/index\.ts';/.exec(doc)?.[1] ?? '';
		const names = block
			.split(',')
			.map((name) => name.trim())
			.filter(Boolean);
		expect(names.length).toBeGreaterThan(20);
		for (const name of names) expect(api, name).toHaveProperty(name);
	});

	it('holds no secrets or private configuration and names the real endpoint', () => {
		expect(doc).not.toMatch(/sk-[A-Za-z0-9]{8,}/);
		expect(doc).not.toMatch(/OPENAI_API_KEY=\S/);
		expect(doc).toContain('/api/assistant');
	});
});
