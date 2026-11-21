import { render } from 'vitest-browser-svelte';
import { expect, it } from 'vitest';
import CompareViews from './CompareViews.svelte';
import type { ResolvePrintedFact } from './verifyFacts';

const cooker = 'cooker-one-button';
const name = { en: 'One-button rice cooker', th: 'หม้อหุงข้าวปุ่มเดียว' };
const resolve: ResolvePrintedFact = (productId, field, locale) => {
	if (productId !== cooker) return;
	const identity = { productId, field, source: 'catalog' as const };
	if (field === 'name') return { ...identity, raw: name, text: name[locale] };
	if (field === 'price')
		return { ...identity, raw: 690, text: locale === 'th' ? '690 บาท' : '฿690' };
	if (field === 'spec.capacity') {
		return { ...identity, raw: 1.8, text: locale === 'th' ? '1.8 ลิตร' : '1.8 L' };
	}
};

it('switches one pane from Visual vibrant to Mom mode and checks both localized shelves', async () => {
	const screen = await render(CompareViews, {
		productsFor: () => [cooker],
		columns: [{ field: 'spec.capacity', label: { en: 'Capacity', th: 'ความจุ' } }],
		listingHref: (id: string) => `/product/${id}`,
		locale: 'en'
	});
	const left = screen.getByRole('region', { name: 'Left view', exact: true });
	const right = screen.getByRole('region', { name: 'Right view', exact: true });
	await expect.element(left.getByRole('table')).toBeVisible();
	await expect.element(left.getByRole('heading', { name: 'What matters' })).toBeVisible();
	await expect.element(left.getByRole('columnheader', { name: 'Capacity' })).toBeVisible();
	await expect.element(right.getByRole('combobox')).toHaveValue('visual');
	await expect.element(right.getByRole('heading', { name: 'Top picks' })).toBeVisible();
	await expect.element(right.getByRole('heading', { name: 'What buyers say' })).toBeVisible();
	await expect
		.element(right.getByText('A simple cooker with one button and a clear indicator.'))
		.toBeVisible();
	await expect.element(right.getByText('฿690')).toBeVisible();
	await right.getByRole('combobox').selectOptions('mom');
	await expect.element(left.getByText('฿690')).toBeVisible();
	await expect.element(right.getByText('690 บาท')).toBeVisible();
	await expect.element(right.getByText('690 บาท')).toHaveAttribute('data-raw', '690');
	await expect.element(left.getByText('฿690')).toHaveAttribute('data-product', cooker);
	await expect.element(right.getByText('หม้อหุงข้าวปุ่มเดียว ใช้ง่าย มีไฟแสดงสถานะชัดเจน')).toBeVisible();
	await expect.element(right.getByText('50 บาท')).toHaveAttribute('data-field', 'shipping');
	await expect.element(right.getByText('1.8 ลิตร', { exact: true })).not.toBeInTheDocument();
	await expect.element(right.getByRole('heading', { name: 'สิ่งที่ควรดู' })).toBeVisible();
	await expect.element(right.getByRole('heading', { name: 'ดีลที่ดีที่สุด' })).not.toBeInTheDocument();
	await expect
		.element(right.getByRole('heading', { name: 'แชร์กับครอบครัว' }))
		.not.toBeInTheDocument();
	await expect.element(screen.getByText('Facts identical (3 checked)')).toBeVisible();
});

it('offers Standard with the catalog rating, shop and shipping fields', async () => {
	const screen = await render(CompareViews, {
		productsFor: () => [cooker],
		columns: [{ field: 'spec.capacity', label: { en: 'Capacity', th: 'ความจุ' } }],
		listingHref: (id: string) => `/product/${id}`,
		locale: 'en'
	});
	const left = screen.getByRole('region', { name: 'Left view', exact: true });
	await left.getByRole('combobox').selectOptions('standard');
	await expect
		.element(left.getByText('4.8', { exact: true }))
		.toHaveAttribute('data-field', 'rating');
	await expect.element(left.getByText('฿50')).toHaveAttribute('data-field', 'shipping');
	await expect.element(left.getByText('บ้านครัว HomeKrua')).toHaveAttribute('data-field', 'shop');
	await expect.element(left.getByRole('table')).not.toBeInTheDocument();
	await expect.element(left.getByRole('heading', { name: 'Top picks' })).not.toBeInTheDocument();
});

it('keeps the shopper’s Thai in Tech and Visual panes', async () => {
	const screen = await render(CompareViews, {
		productsFor: () => [cooker],
		columns: [],
		resolve,
		listingHref: (id: string) => `/product/${id}`,
		locale: 'th'
	});
	const left = screen.getByRole('region', { name: 'มุมมองซ้าย', exact: true });
	const right = screen.getByRole('region', { name: 'มุมมองขวา', exact: true });
	await expect.element(left.getByText('690 บาท')).toBeVisible();
	await expect.element(right.getByText('690 บาท')).toBeVisible();
	await expect.element(screen.getByText('ข้อมูลตรงกัน (ตรวจแล้ว 2 รายการ)')).toBeVisible();
});
