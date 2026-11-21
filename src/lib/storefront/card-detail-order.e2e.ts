import { expect, test } from '@playwright/test';
import { formatFact, resolveFact } from '../catalog';
import { defaultPlan } from '../personalization/plan';
import { rawAttribute } from './verify';

for (const locale of ['en', 'th'] as const) {
	test(`adaptive cards present selected catalog facts in shopper order in ${locale}`, async ({
		page,
		context
	}) => {
		await page.addInitScript(
			(plan) => {
				localStorage.setItem('dynamicshopper.store.v1', JSON.stringify({ plan }));
			},
			{
				...defaultPlan,
				locale,
				category: 'mouse',
				details: ['reviews', 'shipping', 'image', 'price'],
				layout: locale === 'en' ? 'grid' : 'list'
			}
		);
		await page.goto('/?view=receipt');
		const card = page.locator('[data-product-card="aero-x"]');
		await expect(card.locator('[data-fact="review.0"]')).toBeVisible();
		await context.setOffline(true);
		await expect
			.poll(() =>
				card
					.locator('[data-card-field]')
					.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-card-field')))
			)
			.toEqual(['reviews', 'shipping', 'image', 'price']);
		const fields = card.locator(
			'[data-fact="review.0"], [data-fact="shipping"], [data-fact="price"]'
		);
		await expect
			.poll(() =>
				fields.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-fact')))
			)
			.toEqual(['review.0', 'shipping', 'price']);
		for (const field of ['review.0', 'shipping', 'price']) {
			const fact = resolveFact('aero-x', field)!;
			const node = card.locator(`[data-fact="${field}"]`);
			await expect(node).toHaveText(formatFact(fact, locale));
			await expect(node).toHaveAttribute('data-source', 'catalog');
			await expect(node).toHaveAttribute('data-raw', rawAttribute(fact.raw));
		}
		await expect(card.locator('[data-fact="rating"], [data-fact="shop"]')).toHaveCount(0);
		await expect(card.getByRole('link')).toHaveCount(1);
		await expect(
			card.getByRole('button', { name: locale === 'en' ? 'Best price' : 'ราคาดีที่สุด', exact: true })
		).toBeVisible();
	});
}

test('the public photographic shelf keeps its catalog image and standard facts', async ({
	page
}) => {
	await page.goto('/');
	const card = page.locator('[data-product-card="aero-x"]');
	await expect(card.locator('.demo-photo')).toHaveCount(1);
	await expect(card.locator('[data-fact="price"]')).toHaveText(
		formatFact(resolveFact('aero-x', 'price')!, 'en')
	);
	await expect(card.locator('[data-fact="shipping"]')).toBeVisible();
	await expect(card.locator('[data-fact="rating"]')).toBeVisible();
	await expect(card.locator('[data-fact^="review."]')).toHaveCount(0);
});
