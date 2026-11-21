<script lang="ts">
	import { formatFact, resolveFact, type Locale } from '../catalog/index.ts';
	import { rawAttribute } from './verify';

	let {
		productId,
		field,
		locale,
		tag = 'span',
		class: cssClass
	}: {
		productId: string;
		field: string;
		locale: Locale;
		tag?: 'span' | 'strong' | 's' | 'h3' | 'p' | 'dd';
		class?: string;
	} = $props();
	const fact = $derived(resolveFact(productId, field));
</script>

{#if fact}
	<svelte:element
		this={tag}
		class={cssClass}
		data-fact-node
		data-product-id={productId}
		data-fact={field}
		data-raw={rawAttribute(fact.raw)}
	>
		{formatFact(fact, locale)}
	</svelte:element>
{/if}
