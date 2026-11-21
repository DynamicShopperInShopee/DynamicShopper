import { render } from 'vitest-browser-svelte';
import { expect, it } from 'vitest';
import RankingReasons from './RankingReasons.svelte';

const terms = [
	{ label: { en: 'Longer battery life', th: 'แบตเตอรี่อึดขึ้น' }, contribution: 0.8 },
	{ label: { en: 'Lower weight', th: 'น้ำหนักเบาลง' }, contribution: 0.55 },
	{ label: { en: 'Lower price', th: 'ราคาต่ำลง' }, contribution: 0.2 },
	{ label: { en: 'Higher rating', th: 'คะแนนสูงขึ้น' }, contribution: 0.1 }
];

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
	).toEqual(['full', 'wide', 'short']);
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
