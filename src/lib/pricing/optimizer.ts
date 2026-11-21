import type { Product, Voucher } from '../catalog/index.ts';

export const DEFAULT_COIN_BALANCE = 1200;

export type BasketItem = Readonly<{ productId: string; quantity: number }>;
export type PricingContext = Readonly<{ openedAt: number; now: number; coinBalance?: number }>;
export type PricedItem = BasketItem &
	Readonly<{ shopId: string; unitPrice: number; subtotal: number }>;
export type ShopReceipt = Readonly<{
	shopId: string;
	items: readonly PricedItem[];
	subtotal: number;
	shipping: number;
}>;
type VoucherLine = Readonly<{
	code: string;
	kind: Voucher['kind'];
	shopId?: string;
	expiresSoon: boolean;
}>;
export type AppliedVoucher = VoucherLine & Readonly<{ amount: number }>;
export type UnusedVoucher = VoucherLine &
	(
		| Readonly<{ reason: 'minimum-spend'; gap: number }>
		| Readonly<{ reason: 'expired' | 'no-eligible-item' | 'beaten'; gap?: never }>
	);

export type DealReceipt = Readonly<{
	items: readonly PricedItem[];
	shops: readonly ShopReceipt[];
	subtotal: number;
	shipping: number;
	baseline: number;
	appliedVouchers: readonly AppliedVoucher[];
	coinsUsed: number;
	total: number;
	savings: number;
	unusedVouchers: readonly UnusedVoucher[];
}>;

export type PricingProduct = Pick<Product, 'id' | 'price' | 'shipping'> &
	Readonly<{ shopId: string }>;
type ActiveVoucher = { terms: Voucher; line: VoucherLine; expired: boolean };
type Combination = { appliedVouchers: readonly AppliedVoucher[]; coinsUsed: number; total: number };

const DAY_MS = 24 * 60 * 60 * 1000;
// Keep exact search bounded. Return no quote if the distinct slots still exceed this budget.
const MAX_COMBINATIONS = 100_000;
const UNUSED_PRIORITY = { 'minimum-spend': 0, expired: 1, 'no-eligible-item': 2, beaten: 2 };

export function compareIds(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function groupBasket(basket: readonly BasketItem[], catalog: readonly PricingProduct[]) {
	const products = new Map(catalog.map((product) => [product.id, product]));
	const quantities = new Map<string, number>();
	for (const item of basket) {
		if (!item || typeof item.productId !== 'string' || !products.has(item.productId)) return null;
		if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) return null;
		const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
		if (!Number.isSafeInteger(quantity)) return null;
		quantities.set(item.productId, quantity);
	}

	const items: PricedItem[] = [];
	const shops = new Map<
		string,
		{ shopId: string; items: PricedItem[]; subtotal: number; shipping: number }
	>();
	for (const [productId, quantity] of [...quantities].sort(([a], [b]) => compareIds(a, b))) {
		const product = products.get(productId)!;
		const subtotal = product.price * quantity;
		if (!Number.isSafeInteger(subtotal) || subtotal < 0) return null;
		const pricedItem = {
			productId,
			quantity,
			shopId: product.shopId,
			unitPrice: product.price,
			subtotal
		};
		items.push(pricedItem);
		const shop = shops.get(product.shopId) ?? {
			shopId: product.shopId,
			items: [],
			subtotal: 0,
			shipping: 0
		};
		shop.items.push(pricedItem);
		shop.subtotal += subtotal;
		shop.shipping = Math.max(shop.shipping, product.shipping);
		shops.set(product.shopId, shop);
	}

	return { items, shops: [...shops.values()].sort((a, b) => compareIds(a.shopId, b.shopId)) };
}

function voucherStates(vouchers: readonly Voucher[], context: PricingContext) {
	const states: ActiveVoucher[] = [];
	for (const terms of vouchers) {
		const expiresAt = context.openedAt + terms.expiresAfterMs;
		if (!Number.isSafeInteger(expiresAt)) return null;
		const remaining = expiresAt - context.now;
		states.push({
			terms,
			line: {
				code: terms.code,
				kind: terms.kind,
				...(terms.shopId === undefined ? {} : { shopId: terms.shopId }),
				expiresSoon: remaining > 0 && remaining <= DAY_MS
			},
			expired: remaining <= 0
		});
	}
	return states;
}

function applyVoucher(
	voucher: ActiveVoucher,
	spend: number,
	target: number
): AppliedVoucher | undefined {
	if (spend < voucher.terms.minSpend) return;
	const discount = voucher.terms.discount;
	const amount =
		discount.kind === 'fixed'
			? Math.min(discount.amount, target)
			: Math.min(Number((BigInt(target) * BigInt(discount.percent)) / 100n), discount.cap, target);
	if (amount > 0) return { ...voucher.line, amount };
}

function orderSlot(
	active: readonly ActiveVoucher[],
	kind: 'platform' | 'shipping',
	subtotal: number
): ActiveVoucher[] {
	const byTerms = new Map<string, ActiveVoucher>();
	for (const voucher of active) {
		const { code, minSpend, discount } = voucher.terms;
		if (voucher.terms.kind !== kind || minSpend > subtotal) continue;
		const key =
			discount.kind === 'fixed'
				? `${minSpend}:fixed:${discount.amount}`
				: `${minSpend}:percent:${discount.percent}:${discount.cap}`;
		const equivalent = byTerms.get(key);
		if (!equivalent || compareIds(code, equivalent.terms.code) < 0) byTerms.set(key, voucher);
	}
	return [...byTerms.values()];
}

function findBestCombination(
	shops: readonly ShopReceipt[],
	states: readonly ActiveVoucher[],
	subtotal: number,
	shipping: number,
	coinBalance: number
): Combination | null {
	const active = states.filter(({ expired }) => !expired);
	const platform = orderSlot(active, 'platform', subtotal);
	const delivery = shipping > 0 ? orderSlot(active, 'shipping', subtotal) : [];
	const shopSlots: AppliedVoucher[][] = [];
	let combinations = (platform.length + 1) * (delivery.length + 1);
	if (combinations > MAX_COMBINATIONS) return null;

	for (const shop of shops) {
		const byAmount = new Map<number, AppliedVoucher>();
		for (const voucher of active) {
			if (voucher.terms.kind !== 'shop' || voucher.terms.shopId !== shop.shopId) continue;
			const applied = applyVoucher(voucher, shop.subtotal, shop.subtotal);
			if (!applied) continue;
			// An equal shop saving leaves the exact same spend for later slots.
			const equivalent = byAmount.get(applied.amount);
			if (!equivalent || compareIds(applied.code, equivalent.code) < 0)
				byAmount.set(applied.amount, applied);
		}
		if (byAmount.size === 0) continue;
		combinations *= byAmount.size + 1;
		if (combinations > MAX_COMBINATIONS) return null;
		shopSlots.push([...byAmount.values()]);
	}

	let best: Combination | null = null;
	let bestCodes: string[] = [];
	const selected: AppliedVoucher[] = [];

	function visitShop(slot: number, itemsAfterShop: number) {
		if (slot < shopSlots.length) {
			visitShop(slot + 1, itemsAfterShop);
			for (const applied of shopSlots[slot]) {
				selected.push(applied);
				visitShop(slot + 1, itemsAfterShop - applied.amount);
				selected.pop();
			}
			return;
		}

		const platformChoices = [
			undefined,
			...platform
				.map((voucher) => applyVoucher(voucher, itemsAfterShop, itemsAfterShop))
				.filter((voucher) => voucher !== undefined)
		];
		const deliveryChoices = [
			undefined,
			...delivery
				.map((voucher) => applyVoucher(voucher, itemsAfterShop, shipping))
				.filter((voucher) => voucher !== undefined)
		];
		for (const platformVoucher of platformChoices) {
			for (const shippingVoucher of deliveryChoices) {
				const payable =
					itemsAfterShop -
					(platformVoucher?.amount ?? 0) +
					shipping -
					(shippingVoucher?.amount ?? 0);
				const coinsUsed = Math.min(coinBalance, Number(BigInt(payable) / 10n));
				const total = payable - coinsUsed;
				const appliedVouchers = [...selected];
				if (platformVoucher) appliedVouchers.push(platformVoucher);
				if (shippingVoucher) appliedVouchers.push(shippingVoucher);
				if (
					best &&
					(total > best.total ||
						(total === best.total && appliedVouchers.length > bestCodes.length))
				)
					continue;
				const codes = appliedVouchers.map(({ code }) => code).sort(compareIds);
				if (best && total === best.total && codes.length === bestCodes.length) {
					const firstDifference = codes.findIndex((code, index) => code !== bestCodes[index]);
					if (
						firstDifference < 0 ||
						compareIds(codes[firstDifference], bestCodes[firstDifference]) > 0
					)
						continue;
				}
				best = { appliedVouchers, coinsUsed, total };
				bestCodes = codes;
			}
		}
	}

	visitShop(0, subtotal);
	return best;
}

function unusedVouchers(
	states: readonly ActiveVoucher[],
	shops: readonly ShopReceipt[],
	subtotal: number,
	applied: readonly AppliedVoucher[]
): UnusedVoucher[] {
	const used = new Set(applied.map(({ code }) => code));
	const itemsAfterShop = applied.reduce(
		(amount, voucher) => amount - (voucher.kind === 'shop' ? voucher.amount : 0),
		subtotal
	);
	const shopSubtotals = new Map(shops.map(({ shopId, subtotal }) => [shopId, subtotal]));
	const unused: UnusedVoucher[] = [];
	for (const { terms, line, expired } of states) {
		if (used.has(terms.code)) continue;
		const spend = terms.kind === 'shop' ? shopSubtotals.get(terms.shopId ?? '') : itemsAfterShop;
		if (expired) unused.push({ ...line, reason: 'expired' });
		else if (spend === undefined) unused.push({ ...line, reason: 'no-eligible-item' });
		else if (spend < terms.minSpend)
			unused.push({ ...line, reason: 'minimum-spend', gap: terms.minSpend - spend });
		else unused.push({ ...line, reason: 'beaten' });
	}
	return unused.sort(
		(a, b) =>
			UNUSED_PRIORITY[a.reason] - UNUSED_PRIORITY[b.reason] ||
			(a.gap ?? 0) - (b.gap ?? 0) ||
			compareIds(a.code, b.code)
	);
}

export function optimizeBasket(
	basket: readonly BasketItem[],
	context: PricingContext,
	catalog: readonly PricingProduct[],
	vouchers: readonly Voucher[]
): DealReceipt | null {
	if (!Array.isArray(basket) || basket.length === 0 || !context) return null;
	const coinBalance =
		context.coinBalance === undefined ? DEFAULT_COIN_BALANCE : context.coinBalance;
	if (
		!Number.isSafeInteger(coinBalance) ||
		coinBalance < 0 ||
		!Number.isSafeInteger(context.openedAt) ||
		!Number.isSafeInteger(context.now) ||
		context.now < context.openedAt
	)
		return null;

	const grouped = groupBasket(basket, catalog);
	if (!grouped) return null;
	const { items, shops } = grouped;
	const subtotal = shops.reduce((sum, shop) => sum + shop.subtotal, 0);
	const shipping = shops.reduce((sum, shop) => sum + shop.shipping, 0);
	const baseline = subtotal + shipping;
	if (!Number.isSafeInteger(baseline) || baseline < 0) return null;

	const states = voucherStates(vouchers, context);
	if (!states) return null;
	const best = findBestCombination(shops, states, subtotal, shipping, coinBalance);
	// A basket beyond this search budget has no confirmed exact total.
	if (!best) return null;
	return {
		items,
		shops,
		subtotal,
		shipping,
		baseline,
		...best,
		savings: baseline - best.total,
		unusedVouchers: unusedVouchers(states, shops, subtotal, best.appliedVouchers)
	};
}
