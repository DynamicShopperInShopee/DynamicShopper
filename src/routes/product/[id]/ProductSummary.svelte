<script lang="ts">
	import type { catalog, Language, riceCookerSpecs } from '../../../lib/store-catalog';
	import { formatBaht, formatNumber } from '../../../lib/store-search';

	let {
		product,
		language,
		specs,
		hasReview
	}: {
		product: (typeof catalog)[number];
		language: Language;
		specs?: (typeof riceCookerSpecs)[string];
		hasReview: boolean;
	} = $props();
	const th = $derived(language === 'th');
</script>

<section aria-labelledby="product-title">
	<dl class="prices">
		<div>
			<dt>{th ? 'ราคา' : 'Price'}</dt>
			<dd class="price" data-fact="price" data-raw={product.price}>{formatBaht(product.price)}</dd>
		</div>
		{#if product.originalPrice !== null}
			<div>
				<dt>{th ? 'ราคาเดิม' : 'Original price'}</dt>
				<dd data-fact="originalPrice" data-raw={product.originalPrice}>
					<s>{formatBaht(product.originalPrice)}</s>
				</dd>
			</div>
		{/if}
		<div class="sold">
			<dt>{th ? 'ขายแล้ว' : 'Sold'}</dt>
			<dd data-fact="sold" data-raw={product.sold}>{formatNumber(product.sold)}</dd>
		</div>
	</dl>
	{#if specs}
		<dl class="highlights">
			<div>
				<dt>{th ? 'ความจุ' : 'Capacity'}</dt>
				<dd data-fact="capacity" data-raw={specs[0]}>
					{formatNumber(specs[0])}
					{th ? 'ลิตร' : 'L'}
				</dd>
			</div>
			<div>
				<dt>{th ? 'การรับประกัน' : 'Warranty'}</dt>
				<dd data-fact="warranty" data-raw={specs[3]}>
					{formatNumber(specs[3])}
					{th ? 'ปี' : specs[3] === 1 ? 'year' : 'years'}
				</dd>
			</div>
		</dl>
	{/if}
	<h1 id="product-title" data-fact="name" data-raw={product.name[language]}>
		{product.name[language]}
	</h1>
	<dl class="facts">
		<div class="delivery">
			<dt>
				<svg
					aria-hidden="true"
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8" />
					<circle cx="6" cy="18" r="2" />
					<circle cx="18" cy="18" r="2" />
				</svg>
				{th ? 'ค่าจัดส่ง' : 'Shipping'}
			</dt>
			<dd data-fact="shipping" data-raw={product.shipping}>
				{product.shipping === 0 ? (th ? 'ฟรี' : 'Free') : formatBaht(product.shipping)}
			</dd>
		</div>
		{#if !hasReview}
			<div>
				<dt>{th ? 'คะแนน' : 'Rating'}</dt>
				<dd data-fact="rating" data-raw={product.rating}>{formatNumber(product.rating)}</dd>
			</div>
		{/if}
	</dl>
</section>

<style>
	section {
		--inset: 1rem;
		--seam: #e9e6dc;
		min-width: 0;
	}
	dl,
	dd,
	h1 {
		margin: 0;
	}
	dd {
		font-family: var(--product-figure-font);
	}
	.prices,
	.highlights,
	h1,
	.facts > div {
		padding-inline: var(--inset);
	}
	.prices,
	.highlights,
	.sold {
		display: flex;
		flex-wrap: wrap;
		column-gap: 0.65rem;
		align-items: baseline;
	}
	.prices,
	.highlights {
		padding-block: 0.85rem;
	}
	.prices div:not(.sold) dt {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.price {
		font-size: 1.7rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}
	.prices s,
	.sold {
		font-size: 0.875rem;
	}
	.sold {
		column-gap: 0.25rem;
		margin-inline-start: auto;
	}
	.highlights {
		gap: 0.4rem 1.5rem;
		border-top: 1px solid var(--seam);
		font-size: 0.875rem;
	}
	.highlights div {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.45rem;
	}
	.highlights dt {
		color: #5d5d63;
	}
	.highlights dd {
		font-weight: 700;
	}
	h1 {
		border-block: 1px solid var(--seam);
		padding-block: 0.95rem;
		overflow-wrap: anywhere;
		font-size: 1.25rem;
		line-height: 1.4;
	}
	.facts > div {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.35rem 1rem;
		align-items: center;
		min-height: 44px;
		padding-block: 0.6rem;
	}
	.facts > div + div {
		border-top: 1px solid var(--seam);
	}
	.delivery dt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	@media (max-width: 699px) {
		section {
			--inset: 0.8rem;
		}
		.price {
			font-size: 1.375rem;
		}
		h1 {
			align-content: center;
			min-height: 3.75rem;
			font-size: 1rem;
			font-weight: 400;
		}
		.facts .delivery {
			grid-template-columns: 1fr;
			align-content: center;
			min-height: 5.5rem;
		}
		.delivery dd {
			margin-inline-start: calc(22px + 0.5rem);
		}
	}
</style>
