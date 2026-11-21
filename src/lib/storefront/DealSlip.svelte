<script lang="ts">
	import { formatBaht, getProduct, getShop } from '../catalog/index.ts';
	import type { AddOn, DealReceipt, Locale, UnusedVoucher } from '#lib/contracts.ts';

	let {
		receipt,
		locale,
		addOns = []
	}: { receipt: DealReceipt; locale: Locale; addOns?: readonly AddOn[] } = $props();
	const labels = {
		en: {
			title: 'Best deal',
			verified: 'Calculated from catalog',
			subtotal: 'Item subtotal',
			baseline: 'Before discounts',
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
			subtotal: 'รวมราคาสินค้า',
			baseline: 'ก่อนหักส่วนลด',
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

<div
	class="receipt my-4 border [border-block-end-style:dashed] border-[var(--seam,#706f68)] bg-[var(--surface,white)] p-[0.85rem]"
	aria-label={t.title}
	lang={locale}
>
	<h3 class="mx-0 mt-0 mb-[0.55rem]">{t.title}</h3>
	<p class="confirmed font-semibold text-[#0f7b4a]" data-proof="calculated">{t.verified}</p>
	{#each receipt.shops as shop (shop.shopId)}
		<div class="shop mx-0 mt-0 mb-[0.55rem]">
			<strong>{getShop(shop.shopId)?.name[locale]}</strong>
			{#each shop.items as item (item.productId)}
				<div
					class="line flex items-baseline justify-between gap-[0.6rem] py-1 wrap-anywhere [border-block-end:1px_dotted_var(--seam,#706f68)]"
				>
					<span>
						{getProduct(item.productId)?.name[locale]}
						<span
							class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
							data-deal-fact="unitPrice"
							data-raw={item.unitPrice}
						>
							{formatBaht(item.unitPrice, locale)}
						</span>
						<span data-deal-fact="quantity" data-raw={item.quantity}>×{item.quantity}</span>
					</span>
					<span
						class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
						data-deal-fact="itemSubtotal"
						data-raw={item.subtotal}
					>
						{formatBaht(item.subtotal, locale)}
					</span>
				</div>
			{/each}
		</div>
	{/each}
	<div
		class="line flex items-baseline justify-between gap-[0.6rem] py-1 wrap-anywhere [border-block-end:1px_dotted_var(--seam,#706f68)]"
	>
		<span>{t.subtotal}</span>
		<span
			class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
			data-deal-fact="subtotal"
			data-raw={receipt.subtotal}
		>
			{formatBaht(receipt.subtotal, locale)}
		</span>
	</div>
	<div
		class="line flex items-baseline justify-between gap-[0.6rem] py-1 wrap-anywhere [border-block-end:1px_dotted_var(--seam,#706f68)]"
	>
		<span>{t.shipping}</span><span
			class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
			data-deal-fact="shipping"
			data-raw={receipt.shipping}
		>
			{formatBaht(receipt.shipping, locale)}
		</span>
	</div>
	<div
		class="line flex items-baseline justify-between gap-[0.6rem] py-1 wrap-anywhere [border-block-end:1px_dotted_var(--seam,#706f68)]"
	>
		<span>{t.baseline}</span>
		<span
			class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
			data-deal-fact="baseline"
			data-raw={receipt.baseline}
		>
			{formatBaht(receipt.baseline, locale)}
		</span>
	</div>
	{#each receipt.appliedVouchers as voucher (voucher.code)}
		<div
			class="line flex items-baseline justify-between gap-[0.6rem] py-1 wrap-anywhere [border-block-end:1px_dotted_var(--seam,#706f68)]"
		>
			<span>{voucher.code}{voucher.expiresSoon ? ` · ${t.soon}` : ''}</span><span
				class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
				data-deal-fact="discount"
				data-raw={voucher.amount}
			>
				−{formatBaht(voucher.amount, locale)}
			</span>
		</div>
	{/each}
	<div
		class="line flex items-baseline justify-between gap-[0.6rem] py-1 wrap-anywhere [border-block-end:1px_dotted_var(--seam,#706f68)]"
	>
		<span>{t.coins}</span><span
			class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
			data-deal-fact="coins"
			data-raw={receipt.coinsUsed}
		>
			−{formatBaht(receipt.coinsUsed, locale)}
		</span>
	</div>
	<div
		class="line total mt-[0.45rem] flex items-baseline justify-between gap-[0.6rem] py-1 wrap-anywhere [border-block-end:1px_dotted_var(--seam,#706f68)] [border-block-start:2px_solid_currentColor]"
	>
		<strong>{t.total}</strong><strong
			class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
			data-deal-fact="total"
			data-raw={receipt.total}
		>
			{formatBaht(receipt.total, locale)}
		</strong>
	</div>
	<div
		class="line saving mb-2 flex items-baseline justify-between gap-[0.6rem] py-1 wrap-anywhere text-[#0f7b4a] [border-block-end:1px_dotted_var(--seam,#706f68)]"
	>
		<span>{t.saved}</span><span
			class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
			data-deal-fact="savings"
			data-raw={receipt.savings}
		>
			{formatBaht(receipt.savings, locale)}
		</span>
	</div>
	{#if addOns.length}
		<h4 class="mx-0 mt-0 mb-[0.55rem]">{t.extra}</h4>
		{#each addOns as item (item.productId)}
			<div
				class="line flex items-baseline justify-between gap-[0.6rem] py-1 wrap-anywhere [border-block-end:1px_dotted_var(--seam,#706f68)]"
			>
				<span>{getProduct(item.productId)?.name[locale]} · {item.voucherCode}</span><span
					class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
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
			<summary class="min-h-[var(--tap,44px)] cursor-pointer content-center">{t.unused}</summary>
			<ul>
				{#each receipt.unusedVouchers as voucher (voucher.code)}
					<li>
						{voucher.code} · {reason(voucher)}
						{#if voucher.reason === 'minimum-spend'}
							<span
								class="number text-end font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
								data-deal-fact="minimumGap"
								data-raw={voucher.gap}
							>
								{formatBaht(voucher.gap, locale)}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		</details>
	{/if}
</div>
