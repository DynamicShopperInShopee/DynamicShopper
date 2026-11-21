export type FactValue = string | number | boolean | null;

// A rendering view of a fact. The integration supplies its canonical lookup and localized text.
export interface PrintedFact {
	productId: string;
	field: string;
	source: 'catalog';
	raw: FactValue;
	text: string;
}

export type FactLocale = 'en' | 'th';
export type ResolvePrintedFact = (
	productId: string,
	field: string,
	locale: FactLocale
) => PrintedFact | undefined;

interface FactMismatch {
	productId: string;
	field: string;
	reason: 'identity' | 'source' | 'raw' | 'text';
}

export interface FactCheck {
	checked: number;
	mismatches: FactMismatch[];
}

function matchesRaw(serialized: string | null, expected: FactValue): boolean {
	if (serialized === null) return false;
	try {
		const actual: unknown = JSON.parse(serialized);
		return Object.is(actual, expected);
	} catch {
		return false;
	}
}

export function verifyFacts(
	root: ParentNode,
	resolve: ResolvePrintedFact,
	locale: FactLocale = 'en'
): FactCheck {
	const nodes = root.querySelectorAll<HTMLElement>('[data-fact]');
	const result: FactCheck = { checked: 0, mismatches: [] };

	for (const node of nodes) {
		const { product = '', field = '', source } = node.dataset;

		const fact = product && field ? resolve(product, field, locale) : undefined;
		const report = (reason: FactMismatch['reason']) =>
			result.mismatches.push({ productId: product, field, reason });
		if (!fact || fact.productId !== product || fact.field !== field) {
			report('identity');
			continue;
		}

		result.checked++;
		if (source !== fact.source) report('source');
		if (!matchesRaw(node.getAttribute('data-raw'), fact.raw)) report('raw');
		if (node.innerText !== fact.text) report('text');
	}

	return result;
}
