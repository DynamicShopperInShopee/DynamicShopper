import { formatFact, resolveFact } from '../catalog/index.ts';
import type { ResolvePrintedFact } from './verifyFacts';

export const resolveCatalogFact: ResolvePrintedFact = (productId, field, locale) => {
	const fact = resolveFact(productId, field);
	if (!fact) return;
	return {
		productId: fact.productId,
		field: fact.field,
		source: 'catalog',
		raw: fact.raw,
		text: formatFact(fact, locale)
	};
};
