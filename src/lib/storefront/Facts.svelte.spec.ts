import { render } from 'vitest-browser-svelte';
import { describe, expect, it } from 'vitest';
import Fact from './Fact.svelte';
import FactValue from './FactValue.svelte';
import FactsReceipt from './FactsReceipt.svelte';
import FactsSlip from './FactsSlip.svelte';
import { verifyFacts } from './verifyFacts';

const productId = 'cooker-one-button';
const fact = { productId, field: 'price', source: 'catalog', raw: 690, text: '฿690' } as const;
const resolve = (id: string, field: string) =>
	id === productId && field === 'price' ? fact : undefined;

describe('mounted catalog facts', () => {
	it('prints stable identity, typed metadata and canonical visible value', async () => {
		const screen = await render(Fact, { fact });
		const element = screen.getByText(fact.text);
		await expect.element(element).toHaveAttribute('data-product', productId);
		await expect.element(element).toHaveAttribute('data-field', 'price');
		await expect.element(element).toHaveAttribute('data-source', 'catalog');
		await expect.element(element).toHaveAttribute('data-raw', '690');
		expect(verifyFacts(screen.container, resolve)).toEqual({ checked: 1, mismatches: [] });
	});

	it('checks every occurrence independently, including the printed text and raw value', async () => {
		const screen = await render(Fact, { fact });
		const original = screen.getByText(fact.text).element();
		const duplicate = original.cloneNode(true) as HTMLElement;
		screen.container.append(duplicate);
		duplicate.textContent = '฿1';
		expect(verifyFacts(screen.container, resolve).mismatches.map((issue) => issue.reason)).toEqual([
			'text'
		]);
		duplicate.textContent = fact.text;
		duplicate.setAttribute('data-raw', '"690"');
		expect(verifyFacts(screen.container, resolve).mismatches.map((issue) => issue.reason)).toEqual([
			'raw'
		]);
	});

	it('honors the localized canonical text and rejects an unknown identity', async () => {
		const localized = { ...fact, text: '690 บาท' };
		const screen = await render(Fact, { fact: localized });
		const thaiResolver = (id: string, field: string) =>
			resolve(id, field) ? localized : undefined;
		const element = screen.getByText(localized.text).element();
		expect(verifyFacts(screen.container, thaiResolver).checked).toBe(1);
		element.setAttribute('data-product', 'unknown');
		expect(verifyFacts(screen.container, thaiResolver).mismatches[0]?.reason).toBe('identity');
		element.remove();
		expect(verifyFacts(screen.container, thaiResolver)).toEqual({ checked: 0, mismatches: [] });
	});
	it('removes the stamp after tampering and keeps an empty shelf unstamped', async () => {
		const shelf = await render(Fact, { fact });
		const receipt = await render(FactsSlip, { scope: shelf.container, locale: 'en', resolve });
		const stamp = receipt.getByText('1 Facts re-checked against the catalog');
		await expect.element(stamp).toBeVisible();

		const node = shelf.getByText(fact.text).element();
		node.setAttribute('data-source', 'pricing');
		await expect.element(receipt.getByText(/Incorrect source/)).toBeVisible();
		await expect.element(stamp).not.toBeInTheDocument();

		node.remove();
		await expect.element(receipt.getByText('No facts to check yet')).toBeVisible();
		await expect.element(stamp).not.toBeInTheDocument();
	});

	it('checks a printed value whose main fact marker was removed', async () => {
		const shelf = await render(Fact, { fact });
		const node = shelf.getByText(fact.text).element();
		shelf.container.append(node.cloneNode(true));
		node.removeAttribute('data-fact');
		node.textContent = '฿1';

		const result = verifyFacts(shelf.container, resolve);
		expect(result.checked).toBe(2);
		expect(result.mismatches.map(({ reason }) => reason)).toEqual(['identity', 'text']);
	});

	it('refreshes when an ancestor hides or reveals the observed shelf', async () => {
		const shelf = await render(Fact, { fact });
		const wrapper = document.createElement('div');
		shelf.container.before(wrapper);
		wrapper.append(shelf.container);
		try {
			const receipt = await render(FactsSlip, { scope: shelf.container, locale: 'en', resolve });
			const stamp = receipt.getByText('1 Facts re-checked against the catalog');
			await expect.element(stamp).toBeVisible();

			wrapper.hidden = true;
			await expect.element(receipt.getByText('No facts to check yet')).toBeVisible();
			wrapper.hidden = false;
			await expect.element(stamp).toBeVisible();
		} finally {
			wrapper.before(shelf.container);
			wrapper.remove();
		}
	});

	it('verifies both mounted fact shapes and catches a tampered duplicate independently', async () => {
		const legacy = await render(FactValue, { productId, field: 'price', locale: 'en' });
		const legacyFact = legacy.getByText('฿690').element();
		const current = await render(Fact, { fact });
		const currentFact = current.container
			.querySelector<HTMLElement>('[data-field="price"]')!
			.cloneNode(true) as HTMLElement;
		legacy.container.append(currentFact);
		const receipt = await render(FactsReceipt, { root: legacy.container, locale: 'en' });
		const verified = receipt.getByText('Facts verified');
		const failed = receipt.getByText('Displayed facts differ from the catalog');
		await expect.element(verified).toBeVisible();
		expect(
			receipt.container.querySelector('[data-fact="checkedCount"]')?.getAttribute('data-raw')
		).toBe('2');
		await expect.element(legacyFact).toHaveAttribute('data-source', 'catalog');

		currentFact.removeAttribute('data-fact');
		currentFact.textContent = '฿1';
		await expect.element(failed).toBeVisible();
		await expect.element(verified).not.toBeInTheDocument();

		currentFact.remove();
		await expect.element(verified).toBeVisible();
		legacyFact.removeAttribute('data-fact-node');
		await expect.element(failed).toBeVisible();
	});

	it('requires source on old listing facts and ignores unrelated numeric metadata', async () => {
		const legacy = await render(FactValue, { productId, field: 'price', locale: 'th' });
		const listing = document.createElement('dd');
		Object.assign(listing.dataset, {
			factNode: '',
			productId,
			fact: 'spec.capacity',
			raw: '1.8',
			source: 'catalog'
		});
		listing.textContent = '1.8 ลิตร';
		const total = document.createElement('span');
		Object.assign(total.dataset, {
			source: 'cart',
			product: productId,
			field: 'quantity',
			raw: '2'
		});
		total.textContent = '2';
		legacy.container.append(listing, total);
		const receipt = await render(FactsReceipt, { root: legacy.container, locale: 'th' });
		await expect.element(receipt.getByText('ตรวจสอบข้อมูลแล้ว')).toBeVisible();
		expect(
			receipt.container.querySelector('[data-fact="checkedCount"]')?.getAttribute('data-raw')
		).toBe('2');
		listing.removeAttribute('data-source');
		await expect.element(receipt.getByText('พบข้อมูลที่ไม่ตรงกับแค็ตตาล็อก')).toBeVisible();
	});
});
