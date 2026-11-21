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

<label class="grid min-w-0 gap-[0.3rem]">
	<span>{label}</span>
	<select
		class="min-h-[2.75em] w-full border border-[var(--seam,currentColor)] bg-[var(--paper,white)] p-[0.3em] text-inherit"
		bind:value={selected}
	>
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
{#if outside}<p class="mx-0 my-[0.2rem]" role="status">
		{locale === 'th' ? 'อยู่นอกผลลัพธ์ปัจจุบัน' : 'Outside current results'}
	</p>{/if}
