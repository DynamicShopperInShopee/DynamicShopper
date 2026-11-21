import { render } from 'vitest-browser-svelte';
import { expect, it, vi } from 'vitest';
import CitationSlip from './CitationSlip.svelte';
import DealSlip from './DealSlip.svelte';
import { contractSample } from '#lib/fixtures/contract-sample.ts';
import { findAddOns, optimizeDeal } from '../pricing/index.ts';
import { formatBaht } from '../catalog/index.ts';
import ProductListing from './ProductListing.svelte';
import type { ResolvePrintedFact } from './verifyFacts';

const productId = 'cooker-one-button';
const resolve: ResolvePrintedFact = (id, field, locale) =>
	id === productId && field === 'spec.capacity'
		? {
				productId: id,
				field,
				source: 'catalog',
				raw: 1.8,
				text: locale === 'th' ? '1.8 ลิตร' : '1.8 L'
			}
		: undefined;

it('links only canonical citations and declines when no citation survives', async () => {
	const screen = await render(CitationSlip, {
		locale: 'th',
		citations: [
			{ productId, field: 'spec.capacity' },
			{ productId, field: 'price' }
		],
		resolve,
		listingHref: (id: string) => `/product/${id}`
	});
	const link = screen.getByRole('link', { name: '1.8 ลิตร' });
	await expect.element(link).toHaveAttribute('href', '/product/cooker-one-button');
	expect(screen.container.querySelectorAll('a')).toHaveLength(1);
	const fact = link.element().querySelector('[data-fact]');
	expect(fact?.getAttribute('data-source')).toBe('catalog');
	expect(fact?.getAttribute('data-raw')).toBe('1.8');
	await screen.rerender({ citations: [{ productId, field: 'price' }] });
	await expect.element(screen.getByText('ยืนยันจากรายการสินค้าไม่ได้')).toBeVisible();
});

it.each(['en', 'th'] as const)('prints the itemized reference deal in %s', async (locale) => {
	const { basket, pricingContext, expectedDeal } = contractSample;
	const receipt = optimizeDeal(basket, pricingContext);
	expect(receipt).toEqual(expectedDeal);
	if (!receipt) throw new Error('Missing reference deal');
	const addOns = findAddOns(basket, pricingContext);
	const screen = await render(DealSlip, { receipt, locale, addOns });
	const amounts = {
		unitPrice: expectedDeal.items[0].unitPrice,
		itemSubtotal: expectedDeal.items[0].subtotal,
		subtotal: expectedDeal.subtotal,
		baseline: expectedDeal.baseline,
		shipping: expectedDeal.shipping,
		total: expectedDeal.total,
		savings: expectedDeal.savings
	};
	for (const [field, amount] of Object.entries(amounts)) {
		const node = screen.container.querySelector<HTMLElement>(`[data-deal-fact="${field}"]`);
		expect(node?.dataset.raw, field).toBe(String(amount));
		expect(node?.textContent?.trim(), field).toBe(formatBaht(amount, locale));
	}
	expect(screen.container.querySelector('[data-deal-fact="coins"]')?.getAttribute('data-raw')).toBe(
		String(expectedDeal.coinsUsed)
	);
	for (const voucher of expectedDeal.appliedVouchers) {
		await expect.element(screen.getByText(voucher.code, { exact: true })).toBeVisible();
	}
	await screen.getByText(locale === 'en' ? 'Unused vouchers' : 'คูปองที่ไม่ได้ใช้').click();
	for (const voucher of expectedDeal.unusedVouchers) {
		expect(screen.container.querySelector('details')?.textContent).toContain(voucher.code);
	}
	const extras = Array.from(
		screen.container.querySelectorAll('[data-deal-fact="extraCost"]'),
		(el) => el.getAttribute('data-raw')
	);
	expect(extras).toEqual(addOns.map((item) => String(item.extraCost)));
});

it('shows a catalog-backed listing in the requested detail order and delegates shopper actions', async () => {
	const onAdd = vi.fn();
	const onBestPrice = vi.fn();
	const records: Record<string, string | number> = {
		name: 'หม้อหุงข้าวปุ่มเดียว',
		price: 690,
		summary: 'ทำข้าวด้วยปุ่มเดียว',
		'review.0': 'ปุ่มใช้งานง่าย'
	};
	const listingResolver: ResolvePrintedFact = (id, field, locale) => {
		const spec = resolve(id, field, locale);
		if (spec) return spec;
		if (id !== productId || !Object.hasOwn(records, field)) return;
		const raw = records[field];
		return {
			productId: id,
			field,
			source: 'catalog',
			raw,
			text: field === 'price' ? '690 บาท' : String(raw)
		};
	};
	const screen = await render(ProductListing, {
		productId,
		locale: 'th',
		resolve: listingResolver,
		storeHref: '/',
		specs: [{ field: 'spec.capacity', label: { en: 'Capacity', th: 'ความจุ' } }],
		order: ['specs', 'summary', 'reviews'],
		onAdd,
		onBestPrice
	});
	const headings = [...screen.container.querySelectorAll('[data-listing-section] h2')];
	expect(headings.map((heading) => heading.textContent)).toEqual(['สเปกสำคัญ', 'สรุปสินค้า', 'รีวิว']);
	await expect.element(screen.getByText('690 บาท')).toHaveAttribute('data-raw', '690');
	await expect.element(screen.getByText('1.8 ลิตร')).toHaveAttribute('data-raw', '1.8');
	await expect.element(screen.getByText('5 รายการที่ตรวจตรงกับแค็ตตาล็อก')).toBeVisible();
	await screen.getByRole('button', { name: 'เพิ่มในตะกร้า' }).click();
	await screen.getByRole('button', { name: 'ดูราคาที่ดีที่สุด' }).click();
	expect(onAdd).toHaveBeenCalledExactlyOnceWith(productId);
	expect(onBestPrice).toHaveBeenCalledExactlyOnceWith(productId);
	await screen.rerender({ productId: 'unknown' });
	await expect.element(screen.getByRole('heading', { name: 'ไม่พบสินค้า' })).toBeVisible();
	await expect
		.element(screen.getByRole('link', { name: 'กลับหน้าร้าน' }))
		.toHaveAttribute('href', '/');
	expect(screen.container.querySelector('button')).toBeNull();
});
