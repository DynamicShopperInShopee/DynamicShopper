<script lang="ts">
	import { getProduct, specs, type Locale } from '../catalog';
	import type { ShopperPlan } from '../personalization';
	import FactValue from './FactValue.svelte';

	let {
		productId,
		locale,
		details
	}: {
		productId: string;
		locale: Locale;
		details: ShopperPlan['details'];
	} = $props();
	const product = $derived(getProduct(productId));
</script>

{#if product}
	{#each details as field (field)}
		{#if field === 'specs'}
			<dl>
				{#each specs[product.category].filter(({ key }) => product?.specs[key] !== undefined) as spec (spec.key)}
					<div>
						<dt>{spec.label[locale]}</dt>
						<dd><FactValue {productId} field={`spec.${spec.key}`} {locale} /></dd>
					</div>
				{/each}
			</dl>
		{:else if field === 'reviews' && product.reviews.length}
			<blockquote><FactValue {productId} field="review.0" {locale} /></blockquote>
		{:else if field === 'summary'}
			<FactValue tag="p" {productId} field="summary" {locale} />
		{/if}
	{/each}
{/if}

<style>
	dl,
	dd,
	blockquote {
		margin: 0;
	}
	dl {
		display: grid;
		gap: 0.25rem;
	}
	dl div {
		display: flex;
		gap: 0.5rem;
		justify-content: space-between;
		border-bottom: 1px dotted var(--seam);
	}
	dd {
		font-family: 'IBM Plex Mono', monospace;
		text-align: end;
	}
	blockquote {
		border-inline-start: 2px solid var(--seam);
		padding-inline-start: 0.65rem;
	}
</style>
