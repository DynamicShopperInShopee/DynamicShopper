<script lang="ts">
	import type { PageData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: PageData; children: Snippet } = $props();
	const th = $derived(data.language === 'th');
	const highlights = $derived(
		data.category === 'rice-cooker'
			? data.specs.filter((spec) =>
					['spec.capacity', 'spec.warranty'].includes(spec.attributes['data-fact'])
				)
			: []
	);
</script>

<section class="product-summary" aria-labelledby="product-title">
	<dl class="prices">
		<div>
			<dt class="sr-only">{th ? 'ราคา' : 'Price'}</dt>
			<dd class="current" {...data.price.attributes}>{data.price.text}</dd>
		</div>
		{#if data.originalPrice}
			<div>
				<dt class="sr-only">{th ? 'ราคาเดิม' : 'Original price'}</dt>
				<dd class="original" {...data.originalPrice.attributes}>
					<s>{data.originalPrice.text}</s>
				</dd>
			</div>
		{/if}
		<div class="sold">
			<dt>{th ? 'ขายแล้ว' : 'Sold'}</dt>
			<dd {...data.sold.attributes}>{data.sold.text}</dd>
		</div>
	</dl>
	{#if highlights.length}
		<dl class="highlights">
			{#each highlights as spec (spec.attributes['data-fact'])}
				<div>
					<dt>{spec.label}</dt>
					<dd {...spec.attributes}>{spec.text}</dd>
				</div>
			{/each}
		</dl>
	{/if}
	<div class="deal">
		{@render children()}
		<svg
			class="deal-arrow"
			aria-hidden="true"
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<path d="m6 3 5 5-5 5" />
		</svg>
	</div>
	<h1 id="product-title" {...data.name.attributes}>{data.name.text}</h1>
	<dl class="delivery">
		<dt>
			<svg
				aria-hidden="true"
				width="21"
				height="21"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8" />
				<circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
			</svg>
			{th ? 'ค่าจัดส่ง' : 'Shipping'}
		</dt>
		<dd {...data.shipping.attributes}>{data.shipping.text}</dd>
	</dl>
</section>

<style>
	.product-summary {
		--inset: 0.8rem;
		--summary-seam: var(--seam, #e9e6dc);
		min-width: 0;
	}
	dl,
	dd,
	h1 {
		margin: 0;
	}
	dd {
		font-family: var(--product-figure-font);
		font-variant-numeric: tabular-nums;
	}
	.prices,
	.highlights,
	h1,
	.delivery {
		padding-inline: var(--inset);
	}
	.prices,
	.sold,
	.highlights,
	.highlights div {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.25rem 0.45rem;
	}
	.prices {
		padding-block: 0.8rem 0.5rem;
	}
	.current {
		font-size: 1.5em;
		line-height: 1.12;
		font-weight: 700;
		letter-spacing: -0.04em;
	}
	.original,
	.sold,
	.highlights {
		font-size: max(0.875rem, var(--action-font-floor, 0rem));
	}
	.original,
	.highlights dt {
		color: #5d5d63;
	}
	.sold {
		margin-inline-start: auto;
	}
	.highlights {
		padding-block: 0.15rem 0.75rem;
		column-gap: 1rem;
	}
	.deal {
		position: relative;
		padding-inline: var(--inset);
		background: var(--deal-ground, #fbfbf8);
		border-block: 1px solid var(--summary-seam);
	}
	.deal :global(.actions > button) {
		flex: 1;
		padding: 0.5rem 1.7rem 0.5rem 0;
		text-align: start;
		border: 0;
		background: transparent;
		font-weight: 600;
	}
	.deal-arrow {
		position: absolute;
		inset-inline-end: var(--inset);
		top: 16px;
		pointer-events: none;
	}
	h1 {
		display: grid;
		align-content: center;
		min-height: 3.75rem;
		padding-block: 0.8rem;
		font-size: max(1.125rem, var(--action-font-floor, 0rem));
		font-weight: 600;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}
	.delivery {
		display: grid;
		align-content: center;
		gap: 0.25rem;
		min-height: 5.6rem;
		padding-block: 0.75rem;
		border-top: 1px solid var(--summary-seam);
	}
	.delivery dt {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-weight: 600;
	}
	.delivery dd {
		margin-inline-start: calc(21px + 0.55rem);
	}
	@media (min-width: 700px) {
		.product-summary {
			--inset: 1.25rem;
		}
		.prices {
			padding-block-start: 1.25rem;
		}
		.current {
			font-size: 1.875em;
		}
	}
</style>
