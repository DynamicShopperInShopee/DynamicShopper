export type FactLocale = 'en' | 'th';
export type LocalizedText = Readonly<Record<FactLocale, string>>;
export type FactValue = string | number | boolean | null | LocalizedText;

// A rendering view of a fact. The integration supplies its canonical lookup and localized text.
export interface PrintedFact {
	productId: string;
	field: string;
	source: 'catalog';
	raw: FactValue;
	text: string;
}

export type ResolvePrintedFact = (
	productId: string,
	field: string,
	locale: FactLocale
) => PrintedFact | undefined;

export interface FactMismatch {
	productId: string;
	field: string;
	reason: 'identity' | 'source' | 'raw' | 'text';
}

export interface FactCheck {
	checked: number;
	mismatches: FactMismatch[];
}

function matchesValue(actual: unknown, expected: FactValue): boolean {
	if (expected === null || typeof expected !== 'object') return Object.is(actual, expected);
	if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) return false;
	const value = actual as Record<string, unknown>;
	return Object.keys(value).length === 2 && value.en === expected.en && value.th === expected.th;
}

function matchesRaw(serialized: string | null, expected: FactValue, legacy: boolean): boolean {
	if (serialized === null) return false;
	if (legacy && typeof expected === 'string') return serialized === expected;
	try {
		const actual: unknown = JSON.parse(serialized);
		return matchesValue(actual, expected);
	} catch {
		return false;
	}
}

function inspectFacts(
	root: ParentNode,
	resolve: ResolvePrintedFact,
	locale: FactLocale,
	useNodeLanguage = false
) {
	const nodes = root.querySelectorAll<HTMLElement>(
		'.catalog-fact, [data-source="catalog"], [data-fact=""], [data-fact-node], [data-product-id]'
	);
	const result: FactCheck = { checked: 0, mismatches: [] };
	const identities = new Map<string, PrintedFact>();

	for (const node of nodes) {
		if (!node.getClientRects().length || getComputedStyle(node).visibility !== 'visible') continue;
		const legacy = node.hasAttribute('data-fact-node') || node.hasAttribute('data-product-id');
		const product = (legacy ? node.dataset.productId : node.dataset.product) ?? '';
		const field = (legacy ? node.dataset.fact : node.dataset.field) ?? '';
		const markerPresent = legacy
			? node.hasAttribute('data-fact-node')
			: node.getAttribute('data-fact') === '';

		const localized = useNodeLanguage ? node.closest<HTMLElement>('[lang]') : null;
		const lang = localized && root.contains(localized) ? localized.lang : locale;
		const fact =
			product && field
				? resolve(product, field, lang === 'en' || lang === 'th' ? lang : locale)
				: undefined;
		const report = (reason: FactMismatch['reason']) =>
			result.mismatches.push({ productId: product, field, reason });
		if (!fact || fact.productId !== product || fact.field !== field) {
			report('identity');
			continue;
		}

		result.checked++;
		const previousMismatchCount = result.mismatches.length;
		if (!markerPresent) report('identity');
		if (node.dataset.source !== fact.source) report('source');
		if (!matchesRaw(node.getAttribute('data-raw'), fact.raw, legacy)) report('raw');
		if (node.innerText !== fact.text) report('text');
		if (result.mismatches.length === previousMismatchCount) {
			identities.set(JSON.stringify([product, field]), fact);
		}
	}

	return { result, identities };
}

export function verifyFacts(
	root: ParentNode,
	resolve: ResolvePrintedFact,
	locale: FactLocale = 'en',
	useNodeLanguage = false
): FactCheck {
	return inspectFacts(root, resolve, locale, useNodeLanguage).result;
}

interface View {
	root: ParentNode;
	locale: FactLocale;
}

export interface CompareCheck {
	checked: number;
	mismatches: (FactMismatch & { side: 'left' | 'right' })[];
}

export function compareFacts(left: View, right: View, resolve: ResolvePrintedFact): CompareCheck {
	const a = inspectFacts(left.root, resolve, left.locale);
	const b = inspectFacts(right.root, resolve, right.locale);
	const result: CompareCheck = {
		checked: 0,
		mismatches: [
			...a.result.mismatches.map((mismatch) => ({ ...mismatch, side: 'left' as const })),
			...b.result.mismatches.map((mismatch) => ({ ...mismatch, side: 'right' as const }))
		]
	};

	for (const [key, fact] of a.identities) {
		const match = b.identities.get(key);
		if (!match) continue;
		if (matchesValue(fact.raw, match.raw)) {
			result.checked++;
		} else {
			result.mismatches.push({
				productId: fact.productId,
				field: fact.field,
				reason: 'raw',
				side: 'right'
			});
		}
	}

	return result;
}
