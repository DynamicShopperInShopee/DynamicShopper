<script lang="ts">
	import CompareSlip from './CompareSlip.svelte';
	import ProductShelf from './ProductShelf.svelte';
	import type { FactLocale, LocalizedText, ResolvePrintedFact } from './verifyFacts';

	type Preset = 'tech' | 'visual' | 'mom';
	const presets = {
		tech: { label: { en: 'Tech minimal', th: 'สายเทคแบบเรียบง่าย' }, locale: 'en', layout: 'table' },
		visual: { label: { en: 'Visual vibrant', th: 'เน้นภาพสีสด' }, locale: 'en', layout: 'grid' },
		mom: { label: { en: 'Mom mode', th: 'โหมดสำหรับแม่' }, locale: 'th', layout: 'large-print' }
	} as const;
	const options = Object.keys(presets) as Preset[];

	let {
		productIds,
		columns,
		resolve,
		listingHref,
		locale
	}: {
		productIds: readonly string[];
		columns: readonly { field: string; label: LocalizedText }[];
		resolve: ResolvePrintedFact;
		listingHref: (id: string) => string;
		locale: FactLocale;
	} = $props();

	const copy = {
		en: { heading: 'Compare views', left: 'Left view', right: 'Right view' },
		th: { heading: 'เทียบมุมมองหน้าร้าน', left: 'มุมมองซ้าย', right: 'มุมมองขวา' }
	};
	const t = $derived(copy[locale]);
	let leftPreset = $state<Preset>('tech');
	let rightPreset = $state<Preset>('visual');
	let left = $state<HTMLElement>();
	let right = $state<HTMLElement>();
	const a = $derived(presets[leftPreset]);
	const b = $derived(presets[rightPreset]);
</script>

{#snippet presetOptions()}
	{#each options as option (option)}
		<option value={option}>{presets[option].label[locale]}</option>
	{/each}
{/snippet}

<div class="compare" lang={locale}>
	<h1>{t.heading}</h1>
	<div class="panes">
		<section class="pane" data-preset={leftPreset} aria-label={t.left}>
			<label>{t.left}<select bind:value={leftPreset}>{@render presetOptions()}</select></label>
			<div bind:this={left}>
				<ProductShelf
					{productIds}
					{columns}
					{resolve}
					{listingHref}
					layout={a.layout}
					locale={a.locale}
				/>
			</div>
		</section>
		<section class="pane" data-preset={rightPreset} aria-label={t.right}>
			<label>{t.right}<select bind:value={rightPreset}>{@render presetOptions()}</select></label>
			<div bind:this={right}>
				<ProductShelf
					{productIds}
					{columns}
					{resolve}
					{listingHref}
					layout={b.layout}
					locale={b.locale}
				/>
			</div>
		</section>
	</div>
	<CompareSlip {left} {right} leftLocale={a.locale} rightLocale={b.locale} {locale} {resolve} />
</div>

<style>
	.compare {
		display: grid;
		gap: 1rem;
		min-width: 0;
	}
	h1 {
		margin: 0;
	}
	.panes {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.pane {
		padding: 1rem;
		min-width: 0;
		color: var(--ink, #16161a);
		background: var(--surface, #fff);
		border: 1px solid var(--seam, #e9e6dc);
	}
	.pane[data-preset='visual'] {
		--ink: #2f3ccf;
		--seam: #e3e3ef;
	}
	.pane[data-preset='mom'] {
		--ink: #0d0d10;
		--seam: #858172;
		font-size: max(1.25rem, 20px);
	}
	label {
		display: grid;
		gap: 0.375rem;
		margin-bottom: 0.75rem;
	}
	select {
		min-width: 0;
		min-height: 44px;
		padding-inline: 0.625rem;
		font: inherit;
		color: inherit;
		background: var(--surface, #fff);
		border: 1px solid currentColor;
	}
	[data-preset='mom'] select {
		min-height: 48px;
	}
	select:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	@media (max-width: 640px) {
		.panes {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
