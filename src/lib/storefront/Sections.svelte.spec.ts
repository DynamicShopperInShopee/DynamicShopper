import { render } from 'vitest-browser-svelte';
import { expect, it } from 'vitest';
import Sections from './Sections.svelte';
import type { ResolvePrintedFact } from './verifyFacts';

const products = ['cooker-a', 'cooker-b', 'cooker-c', 'cooker-d'];
const resolve: ResolvePrintedFact = (productId, field) => {
	if (!products.includes(productId)) return;
	const identity = { productId, field, source: 'catalog' as const };
	if (field === 'name') return { ...identity, raw: productId, text: productId };
	if (field === 'price') return { ...identity, raw: 690, text: '฿690' };
};

const base = {
	productIds: products,
	layout: 'grid' as const,
	locale: 'en' as const,
	columns: [],
	resolve,
	listingHref: (id: string) => `/product/${id}`
};

it('follows section order, drops unavailable sections and covers every product once', async () => {
	const screen = await render(Sections, {
		...base,
		sections: ['reviews', 'picks', 'picks', 'deal', 'unrecognized']
	});
	await expect.element(screen.getByRole('heading', { name: 'Top picks' })).toBeVisible();
	await expect.element(screen.getByRole('heading', { name: 'Products' })).toBeVisible();
	expect(
		Array.from(screen.container.querySelectorAll('h2'), (heading) => heading.textContent)
	).toEqual(['Top picks', 'Products']);
	expect(
		Array.from(screen.container.querySelectorAll('a'), (link) => link.textContent?.trim())
	).toEqual(products);
});

it('avoids a redundant table and gives unmatched filters a single actionable empty state', async () => {
	const screen = await render(Sections, {
		...base,
		layout: 'table',
		sections: ['compare', 'products']
	});
	expect(screen.container.querySelectorAll('table')).toHaveLength(1);
	expect(screen.container.querySelectorAll('h2')).toHaveLength(0);

	const clear = () => screen.rerender({ productIds: products });
	await screen.rerender({ productIds: [], activeFilters: ['Rice cookers'], onClear: clear });
	await expect.element(screen.getByText('No products match')).toBeVisible();
	await expect.element(screen.getByText('Rice cookers')).toBeVisible();
	expect(screen.container.querySelectorAll('table')).toHaveLength(0);
	await screen.getByRole('button', { name: 'Clear filters' }).click();
	await expect.element(screen.getByRole('table')).toBeVisible();
});

it('keeps one focusable product target when picks cover the shelf or the shelf is empty', async () => {
	const screen = await render(Sections, {
		...base,
		productIds: products.slice(0, 3),
		sections: ['picks', 'products']
	});
	const assertTarget = (label: string) => {
		const targets = screen.container.querySelectorAll<HTMLElement>('#products');
		expect(targets).toHaveLength(1);
		const target = targets[0];
		expect(target).toHaveAttribute('aria-label', label);
		target.focus();
		expect(document.activeElement).toBe(target);
	};
	assertTarget('Top picks');
	await screen.rerender({ productIds: [] });
	assertTarget('No products match');
});
