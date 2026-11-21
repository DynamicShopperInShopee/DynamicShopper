<script lang="ts">
	import { formatBaht, getProduct, getShop, type Locale } from '../catalog/index.ts';
	import type { AddOn, DealReceipt, UnusedVoucher } from '../pricing/index.ts';

	let {
		receipt,
		locale,
		addOns = []
	}: { receipt: DealReceipt; locale: Locale; addOns?: readonly AddOn[] } = $props();
	const labels = {
		en: {
			title: 'Best deal',
			verified: 'Calculated from catalog',
			shipping: 'Shipping',
			coins: 'Coins',
			total: 'Total',
			saved: 'You save',
			unused: 'Unused vouchers',
			extra: 'Only if you need it',
			soon: 'Expires soon',
			expired: 'Expired',
			minimum: 'Spend more to qualify in this combination',
			ineligible: 'No eligible item',
			beaten: 'Another combination wins'
		},
		th: {
			title: 'ดีลที่คุ้มที่สุด',
			verified: 'คำนวณจากแค็ตตาล็อกแล้ว',
			shipping: 'ค่าจัดส่ง',
			coins: 'เหรียญ',
			total: 'ยอดชำระ',
			saved: 'ประหยัด',
			unused: 'คูปองที่ไม่ได้ใช้',
			extra: 'เฉพาะถ้าอยากได้เพิ่ม',
			soon: 'ใกล้หมดอายุ',
			expired: 'หมดอายุ',
			minimum: 'ซื้อเพิ่มเพื่อใช้ในชุดนี้',
			ineligible: 'ไม่มีสินค้าที่ใช้ได้',
			beaten: 'ชุดอื่นคุ้มกว่า'
		}
	};
	const t = $derived(labels[locale]);
	function reason(voucher: UnusedVoucher) {
		switch (voucher.reason) {
			case 'expired':
				return t.expired;
			case 'minimum-spend':
				return t.minimum;
			case 'no-eligible-item':
				return t.ineligible;
			case 'beaten':
				return t.beaten;
		}
	}
</script>

<div class="receipt" aria-label={t.title}>
	<h3>{t.title}</h3>
	<p class="confirmed">{t.verified}</p>
	{#each receipt.shops as shop (shop.shopId)}
		<div class="shop">
			<strong>{getShop(shop.shopId)?.name[locale]}</strong>
			{#each shop.items as item (item.productId)}
				<div class="line">
					<span>
						{getProduct(item.productId)?.name[locale]}
						<span data-deal-fact="quantity" data-raw={item.quantity}>×{item.quantity}</span>
					</span>
					<span class="number" data-deal-fact="itemSubtotal" data-raw={item.subtotal}>
						{formatBaht(item.subtotal, locale)}
					</span>
				</div>
			{/each}
		</div>
	{/each}
	<div class="line">
		<span>{t.shipping}</span><span
			class="number"
			data-deal-fact="shipping"
			data-raw={receipt.shipping}
		>
			{formatBaht(receipt.shipping, locale)}
		</span>
	</div>
	{#each receipt.appliedVouchers as voucher (voucher.code)}
		<div class="line">
			<span>{voucher.code}{voucher.expiresSoon ? ` · ${t.soon}` : ''}</span><span
				class="number"
				data-deal-fact="discount"
				data-raw={voucher.amount}
			>
				−{formatBaht(voucher.amount, locale)}
			</span>
		</div>
	{/each}
	<div class="line">
		<span>{t.coins}</span><span class="number" data-deal-fact="coins" data-raw={receipt.coinsUsed}>
			−{formatBaht(receipt.coinsUsed, locale)}
		</span>
	</div>
	<div class="line total">
		<strong>{t.total}</strong><strong
			class="number"
			data-deal-fact="total"
			data-raw={receipt.total}
		>
			{formatBaht(receipt.total, locale)}
		</strong>
	</div>
	<div class="line saving">
		<span>{t.saved}</span><span class="number" data-deal-fact="savings" data-raw={receipt.savings}>
			{formatBaht(receipt.savings, locale)}
		</span>
	</div>
	{#if addOns.length}
		<h4>{t.extra}</h4>
		{#each addOns as item (item.productId)}
			<div class="line">
				<span>{getProduct(item.productId)?.name[locale]} · {item.voucherCode}</span><span
					class="number"
					data-deal-fact="extraCost"
					data-raw={item.extraCost}
				>
					+{formatBaht(item.extraCost, locale)}
				</span>
			</div>
		{/each}
	{/if}
	{#if receipt.unusedVouchers.length}
		<details>
			<summary>{t.unused}</summary>
			<ul>
				{#each receipt.unusedVouchers as voucher (voucher.code)}
					<li>
						{voucher.code} · {reason(voucher)}
						{#if voucher.reason === 'minimum-spend'}
							<span class="number" data-deal-fact="minimumGap" data-raw={voucher.gap}>
								{formatBaht(voucher.gap, locale)}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		</details>
	{/if}
</div>

<style>
	.receipt {
		border: 1px solid var(--seam, #706f68);
		border-block-end-style: dashed;
		background: var(--surface, white);
		padding: 0.85rem;
		margin-block: 1rem;
	}
	h3,
	h4,
	.shop {
		margin: 0 0 0.55rem;
	}
	.line {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.6rem;
		padding-block: 0.25rem;
		border-block-end: 1px dotted var(--seam, #706f68);
		overflow-wrap: anywhere;
	}
	.total {
		border-block-start: 2px solid currentColor;
		margin-top: 0.45rem;
	}
	.number {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace;
		font-variant-numeric: tabular-nums;
		text-align: end;
	}
	.saving {
		color: #0f7b4a;
		margin-bottom: 0.5rem;
	}
	.confirmed {
		color: #0f7b4a;
		font-weight: 600;
	}
	summary {
		min-block-size: var(--tap, 44px);
		align-content: center;
		cursor: pointer;
	}
</style>
