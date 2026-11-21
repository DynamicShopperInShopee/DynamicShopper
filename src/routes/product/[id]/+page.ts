import { error } from '@sveltejs/kit';
import {
	formatFact,
	getListingDetails,
	getProduct,
	resolveFact,
	specs
} from '../../../lib/catalog';
import type { DetailRow, Fact, Locale } from '../../../lib/catalog';
import { catalog } from '../../../lib/store-catalog';
import { defaultPlan } from '#lib/personalization/plan.ts';
import { parseSharedLook } from '#lib/storefront/browserState.ts';
import { isValidLook, lookFields, validateLook } from '#lib/storefront/sharedLook.ts';
import { rawAttribute } from '../../../lib/storefront/verify';
import type { PageLoad } from './$types';

function presentFact(fact: Fact, locale: Locale) {
	return {
		text: formatFact(fact, locale),
		attributes: {
			'data-fact-node': '',
			'data-product-id': fact.productId,
			'data-fact': fact.field,
			'data-source': 'catalog',
			'data-raw': rawAttribute(fact.raw)
		}
	};
}

function presentDetails(productId: string, locale: Locale) {
	const details = getListingDetails(productId);
	if (!details) return undefined;

	const rows = (items: readonly DetailRow[]) =>
		items.flatMap(({ field, label }) => {
			const value = resolveFact(productId, field);
			return value ? [{ label: label[locale], ...presentFact(value, locale) }] : [];
		});
	const packageCount = resolveFact(productId, 'detail.packageCount');

	return {
		features: rows(details.features),
		modes: rows(details.modes),
		dimensions: rows(details.dimensions),
		packageItems: rows(details.packageItems),
		highlights: rows(details.highlights),
		technical: rows(details.technical),
		packageCount: packageCount && presentFact(packageCount, locale),
		reviewMedia: details.reviewMedia.flatMap(({ reviewField, mediaId, captionField }) => {
			const caption = resolveFact(productId, captionField);
			return caption ? [{ reviewField, mediaId, caption: presentFact(caption, locale) }] : [];
		})
	};
}

export const load: PageLoad = ({ params, url }) => {
	const product =
		getProduct(params.id) ??
		getProduct(catalog.find(({ id }) => id === params.id)?.catalogId ?? '');
	if (!product) error(404, 'Product not found');
	const shelfItem = catalog.find((item) => item.catalogId === product.id)!;
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
	const urlLook = url.searchParams.get('view') === 'receipt' && isValidLook(look);
	const receiptQuery =
		url.searchParams.get('view') === 'receipt'
			? 'view=receipt' + (urlLook ? '&look=' + look : '')
			: '';
	return {
		receiptQuery,
		detailOrder: urlLook
			? (parseSharedLook(look, lookFields, validateLook)?.details ?? defaultPlan.details)
			: undefined,
		id: product.id,
		pathId: params.id,
		photoModel: shelfItem.id,
		photoCategory: shelfItem.category,
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
		reviews: ['review.0', 'review.1'].flatMap((field) => {
			const review = resolveFact(product.id, field);
			return review ? [presentFact(review, language)] : [];
		}),
		summary: fact('summary'),
		listingDetails: presentDetails(product.id, language),
		shop: shop && presentFact(shop, language),
		shopProducts: catalog
			.filter(
				(item) =>
					item.catalogId !== product.id && getProduct(item.catalogId)?.shopId === product.shopId
			)
			.sort((a, b) => b.sold - a.sold)
			.map(({ id, catalogId, category }) => ({ id, catalogId, category })),
		specs: specs[product.category].flatMap(({ key, label }) => {
			const value = resolveFact(product.id, `spec.${key}`);
			return value ? [{ label: label[language], ...presentFact(value, language) }] : [];
		})
	};
};
