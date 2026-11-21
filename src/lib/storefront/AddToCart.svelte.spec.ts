import { render } from 'vitest-browser-svelte';
import { expect, it, vi } from 'vitest';
import AddToCart from './AddToCart.svelte';

it('adds the named product only when the shopper acts and announces success', async () => {
	const onAdd = vi.fn(() => 'added' as const);
	const screen = await render(AddToCart, {
		productId: 'cooker-one-button',
		locale: 'en',
		onAdd
	});

	expect(onAdd).not.toHaveBeenCalled();
	await screen.getByRole('button', { name: /Add to cart.*rice cooker/i }).click();
	expect(onAdd).toHaveBeenCalledExactlyOnceWith('cooker-one-button');
	await expect.element(screen.getByRole('status')).toHaveTextContent('Added to cart');
});

it('distinguishes a full cart from an unavailable quantity in Thai', async () => {
	const onAdd = vi.fn<() => 'full' | 'invalid'>();
	onAdd.mockReturnValueOnce('full').mockReturnValueOnce('invalid');
	const screen = await render(AddToCart, {
		productId: 'cooker-one-button',
		locale: 'th',
		onAdd
	});
	const button = screen.getByRole('button', { name: /เพิ่มลงตะกร้า.*หม้อหุงข้าว/ });

	await button.click();
	await expect.element(screen.getByRole('status')).toHaveTextContent('ตะกร้าเต็ม');
	await button.click();
	await expect.element(screen.getByRole('status')).toHaveTextContent('เพิ่มสินค้าไม่ได้');
	expect(onAdd).toHaveBeenCalledTimes(2);
});

it('waits for the locked cart result before announcing an addition', async () => {
	const deferred = Promise.withResolvers<'added' | 'full'>();
	const onAdd = vi.fn(() => deferred.promise);
	const screen = await render(AddToCart, { productId: 'cooker-one-button', locale: 'en', onAdd });
	const add = screen.getByRole('button', { name: /^Add to cart/ });
	await add.click();
	await expect.element(add).toBeDisabled();
	await expect.element(screen.getByRole('status')).toHaveTextContent('Adding to cart…');
	deferred.resolve('full');
	await expect.element(add).toBeEnabled();
	await expect.element(screen.getByRole('status')).toHaveTextContent('Your cart is full');
});
