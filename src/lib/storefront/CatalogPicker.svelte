<script lang="ts">
	import { formatFact, resolveFact, type Locale } from '../catalog';
	import { rawAttribute } from './verify';
	let {
		label,
		ids,
		locale,
		selected = $bindable(''),
		omit = ''
	}: {
		label: string;
		ids: readonly string[];
		locale: Locale;
		selected?: string;
		omit?: string;
	} = $props();
	const outside = $derived(Boolean(selected) && !ids.includes(selected));
	const options = $derived(outside ? [selected, ...ids] : ids);
</script>

<label>
	<span>{label}</span>
	<select bind:value={selected}>
		<option value="">{locale === 'th' ? 'เลือกสินค้า' : 'Select a product'}</option>
		{#each options as id (id)}
			{@const fact = resolveFact(id, 'name')}
			{#if fact && id !== omit}
				<option
					value={id}
					data-fact-node
					data-product-id={id}
					data-fact="name"
					data-source="catalog"
					data-raw={rawAttribute(fact.raw)}
				>
					{formatFact(fact, locale)}
				</option>
			{/if}
		{/each}
	</select>
</label>
{#if outside}<p role="status">
		{locale === 'th' ? 'อยู่นอกผลลัพธ์ปัจจุบัน' : 'Outside current results'}
	</p>{/if}

<style>
	label {
		display: grid;
		gap: 0.3rem;
		min-width: 0;
	}
	select {
		width: 100%;
		min-height: 2.75em;
		padding: 0.3em;
		background: var(--paper, white);
		color: inherit;
		border: 1px solid var(--seam, currentColor);
		font: inherit;
	}
	p {
		margin: 0.2rem 0;
	}
</style>
