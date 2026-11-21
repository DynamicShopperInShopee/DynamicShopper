import { error } from '@sveltejs/kit';
import { formatFact, getProduct, resolveFact, specs } from '../../../lib/catalog';
import type { Fact, Locale } from '../../../lib/catalog';
import { catalog } from '../../../lib/store-catalog';
import { rawAttribute } from '../../../lib/storefront/verify';
import type { PageLoad } from './$types';

function presentFact(fact: Fact, locale: Locale) {
	return {
		text: formatFact(fact, locale),
		attributes: {
			'data-fact-node': '',
			'data-product-id': fact.productId,
			'data-fact': fact.field,
			'data-raw': rawAttribute(fact.raw)
		}
	};
}

export const load: PageLoad = ({ params, url }) => {
	const product =
		getProduct(params.id) ??
		getProduct(catalog.find(({ id }) => id === params.id)?.catalogId ?? '');
	if (!product) error(404, 'Product not found');
	const language: Locale = url.searchParams.get('lang') === 'th' ? 'th' : 'en';
	const requestedTheme = url.searchParams.get('theme');
	const theme =
		requestedTheme === 'large' || requestedTheme === 'minimal' || requestedTheme === 'vibrant'
			? requestedTheme
			: 'standard';
	const fact = (field: string) => presentFact(resolveFact(product.id, field)!, language);
	const originalPrice = resolveFact(product.id, 'originalPrice');
	const shop = resolveFact(product.id, 'shop');
	const look = url.searchParams.get('look') ?? '';
	const receiptQuery =
		url.searchParams.get('view') === 'receipt'
			? 'view=receipt' +
				(/^(standard|minimal|vibrant|large)\.(grid|list|table)\.(en|th)$/.test(look)
					? '&look=' + look
					: '')
			: '';
	return {
		receiptQuery,
		id: product.id,
		pathId: params.id,
		category: product.category,
		language,
		theme,
		name: fact('name'),
		price: fact('price'),
		originalPrice: originalPrice && presentFact(originalPrice, language),
		sold: fact('sold'),
		shipping: fact('shipping'),
		rating: fact('rating'),
		reviewCount: fact('reviewCount'),
		reviews: [fact('review.0'), fact('review.1')],
		summary: fact('summary'),
		shop: shop && presentFact(shop, language),
		specs: specs[product.category].flatMap(({ key, label }) => {
			const value = resolveFact(product.id, `spec.${key}`);
			return value ? [{ label: label[language], ...presentFact(value, language) }] : [];
		})
	};
};
