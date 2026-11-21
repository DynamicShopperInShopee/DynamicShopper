import { render } from 'vitest-browser-svelte';
import { expect, it } from 'vitest';
import RankingReasons from './RankingReasons.svelte';

const terms = [
	{ kind: 'spec', key: 'battery', direction: 'higher', strength: 'high' },
	{ kind: 'spec', key: 'weight', direction: 'lower', strength: 'medium' },
	{ kind: 'priority', key: 'price', strength: 'low' },
	{ kind: 'priority', key: 'rating', strength: 'low' }
] as const;

it('prints the supplied reasons in order with discrete bars and no numeric copy', async () => {
	const view = await render(RankingReasons, { terms, locale: 'en', productCount: 3 });
	await view.getByText('Why this order?').click();
	expect([...view.container.querySelectorAll('li')].map((row) => row.textContent?.trim())).toEqual([
		'Longer battery life',
		'Lower weight',
		'Lower price'
	]);
	expect(
		[...view.container.querySelectorAll('[data-width]')].map((bar) =>
			bar.getAttribute('data-width')
		)
	).toEqual(['high', 'medium', 'low']);
	expect(view.container.textContent).not.toMatch(/\p{Nd}/u);
});

it('hides inactive reasons and localizes the explanation', async () => {
	const view = await render(RankingReasons, { terms, locale: 'th', productCount: 1 });
	expect(view.container.querySelector('details')).toBeNull();
	await view.rerender({ productCount: 3, comparePane: true });
	expect(view.container.querySelector('details')).toBeNull();
	await view.rerender({ comparePane: false, simplified: true });
	expect(view.container.querySelector('details')).toBeNull();
	await view.rerender({ simplified: false });
	await view.getByText('ทำไมถึงเรียงแบบนี้?').click();
	await expect.element(view.getByText('น้ำหนักเบาลง')).toBeVisible();
});
