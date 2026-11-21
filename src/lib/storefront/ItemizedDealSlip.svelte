<script lang="ts">
	import type { FactLocale } from './verifyFacts';

	type VoucherKind = 'shop' | 'platform' | 'shipping';
	type UnusedReason = 'minimum-spend' | 'expired' | 'no-eligible-item' | 'beaten';
	type Voucher = { code: string; kind: VoucherKind; expiresSoon: boolean };
	interface Receipt {
		items: readonly { productId: string; quantity: number; unitPrice: number; subtotal: number }[];
		subtotal: number;
		shipping: number;
		baseline: number;
		appliedVouchers: readonly (Voucher & { amount: number })[];
		unusedVouchers: readonly (Voucher & { reason: UnusedReason; gap?: number })[];
		coinsUsed: number;
		total: number;
		savings: number;
	}

	let {
		receipt,
		locale,
		formatMoney,
		productName,
		addOns = []
	}: {
		receipt: Receipt | undefined;
		locale: FactLocale;
		formatMoney: (amount: number, locale: FactLocale) => string;
		productName: (id: string, locale: FactLocale) => string | undefined;
		addOns?: readonly { productId: string; extraCost: number; voucherCode: string }[];
	} = $props();

	const copy = {
		en: {
			title: 'Best price',
			pending: 'A deal is unavailable',
			proof: 'Calculated from catalog',
			subtotal: 'Subtotal',
			shipping: 'Shipping',
			baseline: 'Before discounts',
			total: 'Total',
			savings: 'Savings',
			coins: 'Coins used',
			quantity: 'Quantity',
			unitPrice: 'Unit price',
			unused: 'Unused vouchers',
			addOns: 'Only if you need it',
			extraCost: 'Extra cost',
			expiry: 'Expires soon',
			shop: 'Shop voucher',
			platform: 'Platform voucher',
			shippingVoucher: 'Shipping voucher',
			'minimum-spend': 'Minimum spend not met',
			expired: 'Expired',
			'no-eligible-item': 'No eligible item',
			beaten: 'Another deal saved more'
		},
		th: {
			title: 'ราคาที่ดีที่สุด',
			pending: 'ยังไม่มีดีล',
			proof: 'คำนวณจากแค็ตตาล็อก',
			subtotal: 'รวมราคาสินค้า',
			shipping: 'ค่าจัดส่ง',
			baseline: 'ก่อนหักส่วนลด',
			total: 'ยอดสุทธิ',
			savings: 'ประหยัด',
			coins: 'เหรียญที่ใช้',
			quantity: 'จำนวน',
			unitPrice: 'ราคาต่อชิ้น',
			unused: 'โค้ดที่ไม่ได้ใช้',
			addOns: 'ซื้อเพิ่มเฉพาะที่จำเป็น',
			extraCost: 'จ่ายเพิ่ม',
			expiry: 'ใกล้หมดอายุ',
			shop: 'โค้ดร้านค้า',
			platform: 'โค้ดแพลตฟอร์ม',
			shippingVoucher: 'โค้ดส่งฟรี',
			'minimum-spend': 'ยอดซื้อไม่ถึงขั้นต่ำ',
			expired: 'หมดอายุ',
			'no-eligible-item': 'ไม่มีสินค้าที่เข้าเงื่อนไข',
			beaten: 'ดีลอื่นประหยัดกว่า'
		}
	};
	const t = $derived(copy[locale]);
	const number = $derived(new Intl.NumberFormat(locale));
</script>

{#snippet raw(field: string, value: number, text: string)}
	<span
		class="figure font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] tabular-nums"
		data-source="pricing"
		data-field={field}
		data-raw={JSON.stringify(value)}
	>
		{text}
	</span>
{/snippet}

{#snippet money(field: string, label: string, value: number, emphasis?: 'total' | 'applied')}
	<div
		class={[
			'line grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 py-1 [border-bottom:1px_dotted_var(--seam,#e9e6dc)] [&.applied]:text-[var(--verified,#0f7b4a)] [&.total]:text-[1.5em] [&.total]:font-bold [&.total]:[border-top:2px_solid_currentColor]'
		]}
		class:total={emphasis === 'total'}
		class:applied={emphasis === 'applied'}
	>
		<dt class="wrap-anywhere">{label}</dt>
		<dd class="m-0 text-end">{@render raw(field, value, formatMoney(value, locale))}</dd>
	</div>
{/snippet}

{#snippet voucher(line: Voucher)}
	{line.kind === 'shipping' ? t.shippingVoucher : t[line.kind]}
	<span data-source="pricing" data-field="voucher.code" data-raw={JSON.stringify(line.code)}>
		{line.code}
	</span>
	{#if line.expiresSoon}<span class="state text-[var(--void,#b01e31)]"> · {t.expiry}</span>{/if}
{/snippet}

<section
	class="max-w-[28rem] border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4"
	lang={locale}
	aria-label={t.title}
>
	<h2 class="m-0 text-[length:inherit]">{t.title}</h2>
	{#if receipt}
		<p
			class="stamp m-0 my-2 inline-block border border-current px-[0.5em] py-[0.25em] text-[var(--verified,#0f7b4a)]"
			data-proof="calculated"
		>
			{t.proof}
		</p>
		{#each receipt.items as item (item.productId)}
			<div class="item [border-top:1px_dashed_var(--seam,#e9e6dc)]" data-item={item.productId}>
				<h3 class="m-0 mt-3 mb-1 text-[length:inherit]">
					{productName(item.productId, locale) ?? item.productId}
				</h3>
				<dl class="m-0">
					<div
						class="line grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 py-1 [border-bottom:1px_dotted_var(--seam,#e9e6dc)]"
					>
						<dt class="wrap-anywhere">{t.quantity}</dt>
						<dd class="m-0 text-end">
							{@render raw('item.quantity', item.quantity, number.format(item.quantity))}
						</dd>
					</div>
					{@render money('item.unitPrice', t.unitPrice, item.unitPrice)}
					{@render money('item.subtotal', t.subtotal, item.subtotal)}
				</dl>
			</div>
		{/each}
		<dl class="m-0">
			{@render money('subtotal', t.subtotal, receipt.subtotal)}
			{@render money('shipping', t.shipping, receipt.shipping)}
			{@render money('baseline', t.baseline, receipt.baseline)}
			{#each receipt.appliedVouchers as applied (applied.code)}
				<div
					class="line applied grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 py-1 text-[var(--verified,#0f7b4a)] [border-bottom:1px_dotted_var(--seam,#e9e6dc)]"
				>
					<dt class="wrap-anywhere">{@render voucher(applied)}</dt>
					<dd class="m-0 text-end">
						{@render raw('voucher.amount', applied.amount, formatMoney(applied.amount, locale))}
					</dd>
				</div>
			{/each}
			<div
				class="line grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 py-1 [border-bottom:1px_dotted_var(--seam,#e9e6dc)]"
			>
				<dt class="wrap-anywhere">{t.coins}</dt>
				<dd class="m-0 text-end">
					{@render raw('coinsUsed', receipt.coinsUsed, number.format(receipt.coinsUsed))}
				</dd>
			</div>
			{@render money('total', t.total, receipt.total, 'total')}
			{@render money('savings', t.savings, receipt.savings, 'applied')}
		</dl>
		{#if receipt.unusedVouchers.length}
			<h3 class="m-0 mt-3 mb-1 text-[length:inherit]">{t.unused}</h3>
			<ul class="m-0 ps-5">
				{#each receipt.unusedVouchers as unused (unused.code)}
					<li
						class={['[&.expired]:text-[var(--void,#b01e31)]']}
						class:expired={unused.reason === 'expired'}
					>
						{@render voucher(unused)} · {t[unused.reason]}
						{#if unused.gap !== undefined}
							{@render raw('voucher.gap', unused.gap, formatMoney(unused.gap, locale))}
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if addOns.length}
			<h3 class="m-0 mt-3 mb-1 text-[length:inherit]">{t.addOns}</h3>
			<ul class="m-0 ps-5">
				{#each addOns as addOn (addOn.productId)}
					<li>
						{productName(addOn.productId, locale) ?? addOn.productId}
						<span
							data-source="pricing"
							data-field="addOn.voucher"
							data-raw={JSON.stringify(addOn.voucherCode)}
						>
							{addOn.voucherCode}
						</span>
						<dl class="m-0">{@render money('addOn.extraCost', t.extraCost, addOn.extraCost)}</dl>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		<p class="m-0">{t.pending}</p>
	{/if}
</section>
