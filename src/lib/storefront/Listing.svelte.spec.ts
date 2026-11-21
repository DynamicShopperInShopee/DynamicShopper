import { render } from 'vitest-browser-svelte';
import { expect, it, vi } from 'vitest';
import CitationSlip from './CitationSlip.svelte';
import ItemizedDealSlip from './ItemizedDealSlip.svelte';
import ProductListing from './ProductListing.svelte';
import type { FactLocale, ResolvePrintedFact } from './verifyFacts';

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

it('renders the supplied optimizer result consistently from any entry point', async () => {
	const receipt = {
		items: [{ productId, quantity: 1, unitPrice: 690, subtotal: 690 }],
		subtotal: 690,
		shipping: 50,
		baseline: 740,
		appliedVouchers: [{ code: 'SAVE', kind: 'platform' as const, amount: 50, expiresSoon: false }],
		coinsUsed: 25,
		total: 665,
		savings: 75,
		unusedVouchers: [
			{
				code: 'MIN',
				kind: 'shop' as const,
				reason: 'minimum-spend' as const,
				gap: 10,
				expiresSoon: false
			}
		]
	};
	const props = {
		receipt,
		locale: 'en' as const,
		formatMoney: (amount: number, locale: FactLocale) =>
			locale === 'th' ? `${amount} บาท` : `฿${amount}`,
		productName: (id: string) => (id === productId ? 'One-button rice cooker' : undefined),
		addOns: [{ productId, extraCost: 15, voucherCode: 'MIN' }]
	};
	const first = await render(ItemizedDealSlip, props);
	const second = await render(ItemizedDealSlip, props);
	const facts = (root: HTMLElement) =>
		[...root.querySelectorAll('[data-source="pricing"]')].map((node) => [
			node.getAttribute('data-field'),
			node.getAttribute('data-raw'),
			node.textContent?.trim()
		]);
	expect(facts(first.container)).toEqual(facts(second.container));
	expect(facts(first.container)).toContainEqual(['total', '665', '฿665']);
	expect(facts(first.container)).toContainEqual(['addOn.extraCost', '15', '฿15']);
	expect(first.container.textContent).toContain('Minimum spend not met');
	await second.rerender({ receipt: undefined });
	expect(second.container.querySelector('[data-proof="calculated"]')).toBeNull();
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
