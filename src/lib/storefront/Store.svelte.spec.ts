import { describe, expect, it } from 'vitest';
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

describe('browser-scoped storefront state', () => {
	it('restores the priceable portion of the cart, preserves the valid plan and isolates separate visits', () => {
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
		expect(session.addProduct(cooker)).toBe('added');
		expect(session.addProduct('missing')).toBe('invalid');
		const next = createStoreSession();
		expect(next.cart).toEqual([]);
		next.restore(disk);
		expect(next.cart).toEqual([{ productId: cooker, quantity: 3 }]);
		next.removeProduct(cooker);
		expect(JSON.parse(disk.getItem(key)!)).toMatchObject({ cart: [], plan: { theme: 'minimal' } });
		expect(disk.getItem(key)).not.toContain('private');
	});

	it('keeps shopping when browser storage is unavailable', () => {
		const session = createStoreSession();
		session.restore(undefined);
		expect(session.addProduct(cooker)).toBe('added');
		expect(session.cart).toEqual([{ productId: cooker, quantity: 1 }]);
	});
});
