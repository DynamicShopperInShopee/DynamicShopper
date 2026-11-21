export interface CartItem {
	productId: string;
	quantity: number;
}

export const maxDistinctCartItems = 20;
export const cartPanelId = 'shopping-cart';

type MayPrice = (cart: readonly CartItem[]) => boolean;

export function restoreCart(
	value: unknown,
	hasProduct: (id: string) => boolean,
	mayPrice: MayPrice
): CartItem[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const cart: CartItem[] = [];
	const added = new Set<string>();
	for (const entry of value as unknown[]) {
		if (entry === null || typeof entry !== 'object') continue;
		const { productId, quantity } = entry as Partial<CartItem>;
		if (typeof productId !== 'string' || added.has(productId) || !hasProduct(productId)) continue;
		if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1) continue;
		const item = { productId, quantity };
		if (!mayPrice([...cart, item])) continue;
		cart.push(item);
		added.add(productId);
		if (cart.length === maxDistinctCartItems) break;
	}
	return cart;
}

export function addCartItem(
	cart: readonly CartItem[],
	productId: string,
	hasProduct: (id: string) => boolean,
	mayPrice: MayPrice
): { status: 'added' | 'full' | 'invalid'; cart: readonly CartItem[] } {
	if (!hasProduct(productId)) return { status: 'invalid', cart };
	const index = cart.findIndex((item) => item.productId === productId);
	if (index < 0 && cart.length >= maxDistinctCartItems) return { status: 'full', cart };
	const quantity = index < 0 ? 1 : cart[index].quantity + 1;
	if (!Number.isSafeInteger(quantity)) return { status: 'invalid', cart };
	const item = { productId, quantity };
	const candidate = index < 0 ? [...cart, item] : cart.with(index, item);
	return mayPrice(candidate) ? { status: 'added', cart: candidate } : { status: 'invalid', cart };
}
