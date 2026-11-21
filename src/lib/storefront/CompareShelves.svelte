<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Product, Locale } from '../catalog';
	import { personaPlan, rankProducts, type ShopperPlan } from '../personalization';
	import FactsReceipt from './FactsReceipt.svelte';
	import FactValue from './FactValue.svelte';
	import ShelfTable from './ShelfTable.svelte';

	let {
		plan,
		locale,
		eligibleProducts,
		onDeal
	}: {
		plan: ShopperPlan;
		locale: Locale;
		eligibleProducts: readonly Product[];
		onDeal: (productId: string, locale: Locale) => void;
	} = $props();

	let panes = $state<HTMLElement>();
	const search = $derived({
		query: plan.query,
		category: plan.category,
		maxPrice: plan.maxPrice,
		shops: plan.shops,
		mallOnly: plan.mallOnly
	});
	const tech = $derived(
		rankProducts(eligibleProducts, { ...personaPlan('tech'), ...search }).map(
			({ product }) => product
		)
	);
	const mom = $derived(
		rankProducts(eligibleProducts, { ...personaPlan('mom'), ...search }).map(
			({ product }) => product
		)
	);
</script>

<section aria-label={locale === 'th' ? 'เปรียบเทียบหน้าร้าน' : 'Compare views'}>
	<div class="panes" bind:this={panes}>
		<section class="pane tech" data-compare-pane lang="en" aria-label="Tech shopper">
			<h2>Tech shopper</h2>
			<ShelfTable products={tech} locale="en" {onDeal} />
		</section>
		<section class="pane mom" data-compare-pane lang="th" aria-label="โหมดคุณแม่">
			<h2>โหมดคุณแม่</h2>
			{#if mom.length}
				<ul>
					{#each mom as product (product.id)}
						<li data-product={product.id}>
							<a
								href={resolve(`/product/[id]?lang=th&theme=large&view=receipt`, { id: product.id })}
							>
								<FactValue productId={product.id} field="name" locale="th" />
							</a>
							<FactValue productId={product.id} field="summary" locale="th" tag="p" />
							<dl>
								<div>
									<dt>ราคา</dt>
									<dd><FactValue productId={product.id} field="price" locale="th" /></dd>
								</div>
								<div>
									<dt>ค่าจัดส่ง</dt>
									<dd><FactValue productId={product.id} field="shipping" locale="th" /></dd>
								</div>
							</dl>
							<button type="button" onclick={() => onDeal(product.id, 'th')}>ราคาดีที่สุด</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p>ไม่พบสินค้าที่ตรงกับการค้นหา</p>
			{/if}
		</section>
	</div>
	<FactsReceipt root={panes} {locale} compare={true} />
</section>

<style>
	.panes {
		display: grid;
		gap: 1rem;
	}
	.pane {
		min-inline-size: 0;
		padding: 0.85rem;
		border: 1px solid var(--seam);
	}
	.tech {
		--seam: #ecebe6;
		--ink: #16161a;
		--muted: #5d5d63;
		--tap: 44px;
		color: var(--ink);
		background: white;
		font-size: 1rem;
	}
	.mom {
		--seam: #858172;
		--ink: #0d0d10;
		--muted: #3d3d42;
		color: var(--ink);
		background: #fbfbf8;
		font-size: 1.25rem;
	}
	h2 {
		margin: 0 0 0.65rem;
		border-bottom: 2px solid var(--ink);
		font-weight: 600;
	}
	ul,
	dl,
	dd {
		padding: 0;
		margin: 0;
		list-style: none;
	}
	li {
		padding: 0.65rem 0;
		border-bottom: 1px solid var(--seam);
	}
	li:last-child {
		border-bottom: 0;
	}
	li > :global(p) {
		margin: 0 0 0.55rem;
	}
	a,
	button {
		display: inline-flex;
		min-block-size: 48px;
		align-items: center;
		color: inherit;
	}
	a {
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}
	button {
		margin-top: 0.55rem;
		padding-inline: 0.7rem;
		border: 1px solid var(--seam);
		border-radius: 6px;
		background: white;
		cursor: pointer;
	}
	button:hover {
		border-color: var(--ink);
	}
	dl div {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0 0.75rem;
	}
	dt {
		color: var(--muted);
	}
	dd {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace;
		font-variant-numeric: tabular-nums;
	}
	@media (min-width: 1024px) {
		.panes {
			grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		}
	}
</style>
