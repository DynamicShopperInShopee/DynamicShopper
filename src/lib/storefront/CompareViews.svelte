<script lang="ts">
	import { onMount } from 'svelte';
	import { resolveCatalogFact } from './catalogFact';
	import './theme.css';
	import type { Category } from '#lib/store-catalog.js';
	import CompareSlip from './CompareSlip.svelte';
	import ProductShelf from './ProductShelf.svelte';
	import type { FactLocale, LocalizedText, ResolvePrintedFact } from './verifyFacts';

	type Preset = 'tech' | 'visual' | 'mom';
	const presets = {
		tech: {
			label: { en: 'Tech minimal', th: 'สายเทคแบบเรียบง่าย' },
			layout: 'table',
			theme: 'minimal'
		},
		visual: {
			label: { en: 'Visual vibrant', th: 'เน้นภาพสีสด' },
			layout: 'grid',
			theme: 'vibrant'
		},
		mom: {
			label: { en: 'Mom mode', th: 'โหมดสำหรับแม่' },
			layout: 'large-print',
			theme: 'large-print'
		}
	} as const;
	const options = Object.keys(presets) as Preset[];

	let {
		productsFor,
		columns,
		resolve = resolveCatalogFact,
		listingHref,
		categoryFor,
		locale
	}: {
		productsFor: (preset: Preset) => readonly string[];
		columns: readonly { field: string; label: LocalizedText }[];
		resolve?: ResolvePrintedFact;
		listingHref: (
			id: string,
			locale: FactLocale,
			theme: (typeof presets)[Preset]['theme']
		) => string;
		categoryFor?: (id: string) => Category | undefined;
		locale: FactLocale;
	} = $props();

	const copy = {
		en: { left: 'Left view', right: 'Right view' },
		th: { left: 'มุมมองซ้าย', right: 'มุมมองขวา' }
	};
	let interactive = $state(false);
	onMount(() => {
		interactive = true;
	});
	const t = $derived(copy[locale]);
	let leftPreset = $state<Preset>('tech');
	let rightPreset = $state<Preset>('visual');
	let left = $state<HTMLElement>();
	let right = $state<HTMLElement>();
	const a = $derived(presets[leftPreset]);
	const b = $derived(presets[rightPreset]);
	const leftLocale = $derived(leftPreset === 'mom' ? 'th' : locale);
	const rightLocale = $derived(rightPreset === 'mom' ? 'th' : locale);
</script>

{#snippet presetOptions()}
	{#each options as option (option)}
		<option value={option}>{presets[option].label[locale]}</option>
	{/each}
{/snippet}

<div class="compare" lang={locale}>
	<CompareSlip {left} {right} {leftLocale} {rightLocale} {locale} {resolve} />
	<div class="panes">
		<section class="pane" data-storefront-theme={a.theme} aria-label={t.left}>
			<label>
				{t.left}<select disabled={!interactive} bind:value={leftPreset}>
					{@render presetOptions()}
				</select>
			</label>
			<div bind:this={left}>
				<ProductShelf
					productIds={productsFor(leftPreset)}
					{columns}
					{resolve}
					listingHref={(id: string) => listingHref(id, leftLocale, a.theme)}
					{categoryFor}
					layout={a.layout}
					locale={leftLocale}
				/>
			</div>
		</section>
		<section class="pane" data-storefront-theme={b.theme} aria-label={t.right}>
			<label>
				{t.right}<select disabled={!interactive} bind:value={rightPreset}>
					{@render presetOptions()}
				</select>
			</label>
			<div bind:this={right}>
				<ProductShelf
					productIds={productsFor(rightPreset)}
					{columns}
					{resolve}
					listingHref={(id: string) => listingHref(id, rightLocale, b.theme)}
					{categoryFor}
					layout={b.layout}
					locale={rightLocale}
				/>
			</div>
		</section>
	</div>
</div>

<style>
	.compare {
		display: grid;
		gap: 1rem;
		min-width: 0;
	}
	.panes {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.pane {
		padding: 1rem;
		min-width: 0;
		border: 1px solid var(--seam, #e9e6dc);
	}
	label {
		display: grid;
		gap: 0.375rem;
		margin-bottom: 0.75rem;
	}
	select {
		min-width: 0;
		min-height: var(--tap, 44px);
		padding-inline: 0.625rem;
		font: inherit;
		color: inherit;
		background: var(--surface, #fff);
		border: 1px solid currentColor;
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
