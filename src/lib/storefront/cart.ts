export interface CartItem {
	productId: string;
	quantity: number;
}

export const maxDistinctCartItems = 20;

export function restoreCart(
	value: unknown,
	hasProduct: (id: string) => boolean
): CartItem[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const cart: CartItem[] = [];
	const added = new Set<string>();
	for (const entry of value as unknown[]) {
		if (entry === null || typeof entry !== 'object') continue;
		const { productId, quantity } = entry as Partial<CartItem>;
		if (typeof productId !== 'string' || added.has(productId) || !hasProduct(productId)) continue;
		if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1) continue;
		cart.push({ productId, quantity });
		added.add(productId);
		if (cart.length === maxDistinctCartItems) break;
	}
	return cart;
}

export function addCartItem(
	cart: readonly CartItem[],
	productId: string,
	hasProduct: (id: string) => boolean
): { status: 'added' | 'full' | 'invalid'; cart: readonly CartItem[] } {
	if (!hasProduct(productId)) return { status: 'invalid', cart };
	const index = cart.findIndex((item) => item.productId === productId);
	if (index >= 0) {
		const quantity = cart[index].quantity + 1;
		if (!Number.isSafeInteger(quantity)) return { status: 'invalid', cart };
		return {
			status: 'added',
			cart: cart.map((item, position) => (position === index ? { productId, quantity } : item))
		};
	}
	if (cart.length >= maxDistinctCartItems) return { status: 'full', cart };
	return { status: 'added', cart: [...cart, { productId, quantity: 1 }] };
}
