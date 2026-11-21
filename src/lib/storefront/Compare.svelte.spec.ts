import { render } from 'vitest-browser-svelte';
import { describe, expect, it } from 'vitest';
import Fact from './Fact.svelte';
import CompareSlip from './CompareSlip.svelte';
import type { ResolvePrintedFact } from './verifyFacts';

const id = 'cooker-one-button';
const price = { productId: id, field: 'price', source: 'catalog', raw: 690 } as const;
const resolve: ResolvePrintedFact = (productId, field, locale) =>
	productId === id && field === price.field
		? { ...price, text: locale === 'th' ? '690 บาท' : '฿690' }
		: undefined;

describe('rendered comparison proof', () => {
	it('counts distinct shared facts and checks localized text on every occurrence', async () => {
		const left = await render(Fact, { fact: { ...price, text: '฿690' } });
		const right = await render(Fact, { fact: { ...price, text: '690 บาท' } });
		const receipt = await render(CompareSlip, {
			left: left.container,
			right: right.container,
			leftLocale: 'en',
			rightLocale: 'th',
			locale: 'en',
			resolve
		});
		const stamp = receipt.getByText('Facts identical (1 checked)');
		await expect.element(stamp).toBeVisible();

		const original = right.getByText('690 บาท').element();
		const duplicate = original.cloneNode(true);
		right.container.append(duplicate);
		await expect.element(stamp).toBeVisible();
		duplicate.textContent = '1 บาท';
		await expect.element(receipt.getByText(/Incorrect printed value/)).toBeVisible();
		await expect.element(stamp).not.toBeInTheDocument();
		right.container.removeChild(duplicate);
		await expect.element(stamp).toBeVisible();

		left.getByText('฿690').element().textContent = '฿1';
		original.textContent = '฿1';
		await expect.element(stamp).not.toBeInTheDocument();
		await expect.element(receipt.getByText(/Right view/)).toBeVisible();

		left.container.replaceChildren();
		right.container.replaceChildren();
		await expect.element(receipt.getByText('No shared facts to check yet')).toBeVisible();
		await expect.element(stamp).not.toBeInTheDocument();
	});
});
