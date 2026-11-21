import type { Fact } from '../catalog/index.ts';

export function rawAttribute(raw: Fact['raw']) {
	return typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
}
