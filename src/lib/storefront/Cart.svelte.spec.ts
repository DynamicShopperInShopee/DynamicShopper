import { render } from 'vitest-browser-svelte';
import { expect, it, vi } from 'vitest';
import Cart from './Cart.svelte';
import { addCartItem, restoreCart } from './cart';
import type { ResolvePrintedFact } from './verifyFacts';

const productId = 'cooker-one-button';
const resolve: ResolvePrintedFact = (id, field) => {
	if (id !== productId) return;
	const identity = { productId: id, field, source: 'catalog' as const };
	if (field === 'name')
		return { ...identity, raw: 'One-button rice cooker', text: 'One-button rice cooker' };
	if (field === 'price') return { ...identity, raw: 690, text: '฿690' };
};

it('restores valid distinct items with bounded quantities and allows repeats at the cap', () => {
	const allowed = (id: string) => /^item-\d+$/.test(id);
	const input = Array.from({ length: 21 }, (_, i) => ({ productId: `item-${i}`, quantity: 1 }));
	const cart = restoreCart(
		[{ productId: 'bogus', quantity: 1 }, { productId: 'item-0', quantity: -1 }, ...input],
		allowed
	);
	expect(cart).toHaveLength(20);
	if (!cart) throw new Error('Expected valid restored cart');
	expect(addCartItem(cart, 'item-20', allowed)).toEqual({ status: 'full', cart });
	const repeat = addCartItem(cart, 'item-0', allowed);
	expect(repeat.status).toBe('added');
	expect(repeat.cart[0]).toEqual({ productId: 'item-0', quantity: 2 });
});

it('shows canonical unit prices, removes explicitly and closes before requesting the full cart deal', async () => {
	const items = [{ productId, quantity: 2 }];
	const onRemove = vi.fn();
	const onBestPrice = vi.fn();
	const screen = await render(Cart, { items, locale: 'en', resolve, onRemove, onBestPrice });
	const trigger = screen.getByRole('button', { name: 'Cart', exact: true });
	await trigger.click();
	await expect.element(screen.getByText('฿690')).toHaveAttribute('data-raw', '690');
	await screen.getByRole('button', { name: 'Remove One-button rice cooker' }).click();
	expect(onRemove).toHaveBeenCalledExactlyOnceWith(productId);
	await screen.getByRole('button', { name: 'Best price for my cart' }).click();
	expect(onBestPrice).toHaveBeenCalledExactlyOnceWith(items);
	expect(screen.container.querySelector(':popover-open')).toBeNull();
});
