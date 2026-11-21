import { formatFact, resolveFact, type Fact, type Locale } from '../catalog/index.ts';

export function rawAttribute(raw: Fact['raw']) {
	return typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
}

export function inspectFacts(root: HTMLElement, locale: Locale) {
	const facts = new Map<string, string>();
	let checked = 0;
	let mismatches = 0;
	for (const element of root.querySelectorAll<HTMLElement>(
		'[data-fact-node], [data-fact], [data-product-id], [data-raw]:not([data-deal-fact])'
	)) {
		if (element.closest('[hidden], dialog:not([open])')) continue;
		const { productId = '', fact: field = '', raw } = element.dataset;
		const expected = resolveFact(productId, field);
		checked += 1;
		if (
			!expected ||
			raw !== rawAttribute(expected.raw) ||
			element.textContent?.trim() !== formatFact(expected, locale)
		) {
			mismatches += 1;
			continue;
		}
		facts.set(JSON.stringify([productId, field]), raw);
	}
	return { facts, checked, mismatches };
}
