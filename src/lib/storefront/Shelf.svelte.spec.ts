import { render } from 'vitest-browser-svelte';
import { describe, expect, it } from 'vitest';
import CompareSlip from './CompareSlip.svelte';
import ProductShelf from './ProductShelf.svelte';
import type { FactLocale, ResolvePrintedFact } from './verifyFacts';

const id = 'cooker-one-button';
const name = { en: 'One-button rice cooker', th: 'หม้อหุงข้าวปุ่มเดียว' };
const lookup: Record<string, { raw: number | typeof name; text: typeof name }> = {
	name: { raw: name, text: name },
	price: { raw: 690, text: { en: '฿690', th: '690 บาท' } },
	'spec.capacity': { raw: 1.8, text: { en: '1.8 L', th: '1.8 ลิตร' } }
};

const resolve: ResolvePrintedFact = (productId, field, locale) => {
	const value = Object.hasOwn(lookup, field) ? lookup[field] : undefined;
	return productId === id && value
		? { productId, field, source: 'catalog', raw: value.raw, text: value.text[locale] }
		: undefined;
};

const listingHref = (productId: string) => `/product/${productId}`;
const columns = [{ field: 'spec.capacity', label: { en: 'Capacity', th: 'ความจุ' } }];

describe('two shopper shelf layouts', () => {
	it('renders the same verified cooker as a spec table and a Thai large-print list', async () => {
		const left = await render(ProductShelf, {
			layout: 'table',
			locale: 'en',
			productIds: [id],
			columns,
			resolve,
			listingHref
		});
		const right = await render(ProductShelf, {
			layout: 'large-print',
			locale: 'th',
			productIds: [id],
			columns,
			resolve,
			listingHref
		});

		await expect.element(left.getByRole('table')).toBeVisible();
		await expect.element(left.getByRole('columnheader', { name: 'Capacity' })).toBeVisible();
		const listing = right.getByRole('link', { name: name.th });
		await expect.element(listing).toHaveAttribute('href', `/product/${id}`);
		expect(listing.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
		expect(
			Number.parseFloat(getComputedStyle(right.getByText('690 บาท').element()).fontSize)
		).toBeGreaterThanOrEqual(20);

		const receipt = await render(CompareSlip, {
			left: left.container,
			right: right.container,
			leftLocale: 'en',
			rightLocale: 'th',
			locale: 'en',
			resolve
		});
		await expect.element(receipt.getByText('Facts identical (3 checked)')).toBeVisible();
		right.getByText('690 บาท').element().textContent = '1 บาท';
		await expect.element(receipt.getByText(/Incorrect printed value/)).toBeVisible();
		await expect.element(receipt.getByText('Facts identical (3 checked)')).not.toBeInTheDocument();
	});

	it.each(['en', 'th'] as const)(
		'prints a localized empty state in %s',
		async (locale: FactLocale) => {
			const shelf = await render(ProductShelf, {
				layout: 'large-print',
				locale,
				productIds: [],
				columns,
				resolve,
				listingHref
			});
			await expect
				.element(shelf.getByText(locale === 'en' ? 'No products to show' : 'ไม่มีสินค้าให้แสดง'))
				.toBeVisible();
		}
	);
});
