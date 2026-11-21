import { describe, expect, it, vi } from 'vitest';
import { products } from '../catalog';
import { defaultPlan } from '../personalization';
import { createStoreSession } from './store.svelte';

const key = 'dynamicshopper.store.v1';
const cooker = 'cooker-one-button';

function storage() {
	const entries = new Map<string, string>();
	return {
		getItem: (name: string) => entries.get(name) ?? null,
		setItem: (name: string, value: string) => {
			entries.set(name, value);
		}
	};
}

function queuedWrites() {
	const waiting: (() => void)[] = [];
	return {
		waiting,
		lock<Result>(this: void, write: () => Result) {
			return new Promise<Result>((resolve) => waiting.push(() => resolve(write())));
		}
	};
}

describe('browser-scoped storefront state', () => {
	it('restores the priceable portion of the cart, preserves the valid plan and isolates separate visits', async () => {
		const disk = storage();
		disk.setItem(
			key,
			JSON.stringify({
				plan: { theme: 'minimal', layout: 'table', locale: 'th' },
				cart: [
					{ productId: cooker, quantity: 2 },
					{ productId: 'missing', quantity: 1 },
					{ productId: 'aero-x', quantity: Number.MAX_SAFE_INTEGER }
				],
				chat: 'private'
			})
		);
		const session = createStoreSession();
		session.restore(disk);
		expect(session.cart).toEqual([{ productId: cooker, quantity: 2 }]);
		expect(session.savedPlan).toMatchObject({ theme: 'minimal', layout: 'table', locale: 'th' });
		await expect(session.addProduct(cooker)).resolves.toBe('added');
		await expect(session.addProduct('missing')).resolves.toBe('invalid');
		const next = createStoreSession();
		expect(next.cart).toEqual([]);
		next.restore(disk);
		expect(next.cart).toEqual([{ productId: cooker, quantity: 3 }]);
		await next.removeProduct(cooker);
		expect(JSON.parse(disk.getItem(key)!)).toMatchObject({ cart: [], plan: { theme: 'minimal' } });
		expect(disk.getItem(key)).not.toContain('private');
	});

	it('keeps shopping when browser storage is unavailable', async () => {
		const session = createStoreSession();
		session.restore(undefined);
		await expect(session.addProduct(cooker)).resolves.toBe('added');
		expect(session.cart).toEqual([{ productId: cooker, quantity: 1 }]);
	});

	it('rebases cart changes and preserves the other tab’s saved presentation', async () => {
		const disk = storage();
		const first = createStoreSession();
		const second = createStoreSession();
		first.restore(disk);
		second.restore(disk);

		await expect(first.addProduct(cooker)).resolves.toBe('added');
		second.savePlan({ ...defaultPlan, theme: 'minimal' });
		expect(JSON.parse(disk.getItem(key)!)).toMatchObject({
			plan: { theme: 'minimal' },
			cart: [{ productId: cooker, quantity: 1 }]
		});

		await expect(second.addProduct('aero-x')).resolves.toBe('added');
		await expect(first.addProduct(cooker)).resolves.toBe('added');
		expect(JSON.parse(disk.getItem(key)!)).toMatchObject({
			plan: { theme: 'minimal' },
			cart: [
				{ productId: cooker, quantity: 2 },
				{ productId: 'aero-x', quantity: 1 }
			]
		});

		await second.removeProduct('aero-x');
		expect(JSON.parse(disk.getItem(key)!)).toMatchObject({
			plan: { theme: 'minimal' },
			cart: [{ productId: cooker, quantity: 2 }]
		});
	});

	it('restores explicit searches and zero budgets without accepting malformed saved values', () => {
		const disk = storage();
		const first = createStoreSession();
		first.restore(disk);
		first.savePlan({ ...defaultPlan, query: '1.8L', maxPrice: 0 });

		const next = createStoreSession();
		next.restore(disk);
		expect(next.savedPlan).toMatchObject({ query: '1.8L', maxPrice: 0 });

		disk.setItem(
			key,
			JSON.stringify({ plan: { query: ['rice cooker'], maxPrice: -1, locale: 'th' } })
		);
		const malformed = createStoreSession();
		malformed.restore(disk);
		expect(malformed.savedPlan).toMatchObject({ query: '', maxPrice: null, locale: 'th' });
	});

	it('acknowledges simultaneous cart additions only after their writes finish', async () => {
		const disk = storage();
		const { waiting, lock } = queuedWrites();
		const first = createStoreSession();
		const second = createStoreSession();
		first.restore(disk, lock);
		second.restore(disk, lock);

		const firstAddition = first.addProduct(cooker);
		const secondAddition = second.addProduct(cooker);
		await vi.waitFor(() => expect(waiting).toHaveLength(2));
		expect(first.cart).toEqual([]);
		expect(second.cart).toEqual([]);
		expect(disk.getItem(key)).toBeNull();

		waiting.forEach((finish) => finish());
		await expect(Promise.all([firstAddition, secondAddition])).resolves.toEqual(['added', 'added']);
		expect(JSON.parse(disk.getItem(key)!)).toMatchObject({
			cart: [{ productId: cooker, quantity: 2 }]
		});
		expect(second.cart[0].quantity).toBe(2);
	});

	it('shows a removed item until storage can restore the removal', async () => {
		const disk = storage();
		disk.setItem(key, JSON.stringify({ cart: [{ productId: cooker, quantity: 1 }] }));
		const { waiting, lock } = queuedWrites();
		const session = createStoreSession();
		session.restore(disk, lock);

		const removal = session.removeProduct(cooker);
		expect(session.cart).toEqual([{ productId: cooker, quantity: 1 }]);
		await vi.waitFor(() => expect(waiting).toHaveLength(1));
		waiting.shift()!();
		await removal;
		expect(session.cart).toEqual([]);

		const reloaded = createStoreSession();
		reloaded.restore(disk);
		expect(reloaded.cart).toEqual([]);
	});

	it('reports a full cart to the tab that loses the last slot', async () => {
		const disk = storage();
		const rows = products.slice(0, 19).map(({ id }) => ({ productId: id, quantity: 1 }));
		disk.setItem(key, JSON.stringify({ cart: rows }));
		const { waiting, lock } = queuedWrites();
		const first = createStoreSession();
		const second = createStoreSession();
		first.restore(disk, lock);
		second.restore(disk, lock);

		const firstAddition = first.addProduct(products[19].id);
		const secondAddition = second.addProduct(products[20].id);
		await vi.waitFor(() => expect(waiting).toHaveLength(2));
		waiting.forEach((finish) => finish());
		await expect(Promise.all([firstAddition, secondAddition])).resolves.toEqual(['added', 'full']);
		expect(first.cart).toHaveLength(20);
		expect(second.cart).toEqual(first.cart);
	});

	it('waits for the queued cart writes before taking a pricing snapshot', async () => {
		const { waiting, lock } = queuedWrites();
		const session = createStoreSession();
		session.restore(storage(), lock);

		const addition = session.addProduct(cooker);
		const removal = session.removeProduct(cooker);
		let quotedQuantity: number | undefined;
		const pricing = session.cartSettled().then(() => {
			quotedQuantity = session.cart.find(({ productId }) => productId === cooker)?.quantity ?? 0;
		});

		await vi.waitFor(() => expect(waiting).toHaveLength(1));
		waiting.shift()!();
		await expect(addition).resolves.toBe('added');
		expect(quotedQuantity).toBeUndefined();
		await vi.waitFor(() => expect(waiting).toHaveLength(1));
		waiting.shift()!();
		await removal;
		await pricing;
		expect(quotedQuantity).toBe(0);
	});
});
