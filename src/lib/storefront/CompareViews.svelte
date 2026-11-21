<script lang="ts">
	import { comparePresets, presetLabels, type ComparePreset } from './compare';
	import { onMount } from 'svelte';
	import { resolveCatalogFact } from './catalogFact';
	import './theme.css';
	import type { Category } from '#lib/store-catalog.js';
	import { personaPlan, type ShopperPlan } from '#lib/personalization/index.ts';
	import CompareSlip from './CompareSlip.svelte';
	import type { ShelfVoucher } from './ProductShelf.svelte';
	import Sections from './Sections.svelte';
	import { rankingTerms } from './copy';
	import type { FactLocale, LocalizedText, ResolvePrintedFact } from './verifyFacts';

	let {
		leftPreset = $bindable('tech'),
		rightPreset = $bindable('visual'),
		productsFor,
		columns,
		resolve = resolveCatalogFact,
		listingHref,
		categoryFor,
		vouchersFor,
		locale
	}: {
		leftPreset?: ComparePreset;
		rightPreset?: ComparePreset;
		productsFor: (plan: ShopperPlan) => readonly string[];
		columns: readonly { field: string; label: LocalizedText }[];
		resolve?: ResolvePrintedFact;
		listingHref: (id: string, locale: FactLocale, theme: ShopperPlan['theme']) => string;
		categoryFor?: (id: string) => Category | undefined;
		vouchersFor?: (id: string) => readonly ShelfVoucher[];
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
	let left = $state<HTMLElement>();
	let right = $state<HTMLElement>();
	const a = $derived(personaPlan(leftPreset, locale));
	const b = $derived(personaPlan(rightPreset, locale));
</script>

{#snippet presetOptions()}
	{#each comparePresets as option (option)}
		<option value={option}>{presetLabels[option][locale]}</option>
	{/each}
{/snippet}

{#snippet shelf(plan: ShopperPlan)}
	<Sections
		sections={plan.sections}
		productIds={productsFor(plan)}
		layout={plan.layout === 'list' ? 'large-print' : plan.layout}
		locale={plan.locale}
		details={plan.details}
		priorities={Object.keys(plan.priorities).map((key) => {
			const [en, th] = rankingTerms[key];
			return { en, th };
		})}
		{columns}
		{resolve}
		listingHref={(id: string) => listingHref(id, plan.locale, plan.theme)}
		{categoryFor}
		{vouchersFor}
		comparePane
	/>
{/snippet}

<div class="compare" lang={locale}>
	<CompareSlip {left} {right} leftLocale={a.locale} rightLocale={b.locale} {locale} {resolve} />
	<div class="panes">
		<section
			class="pane"
			data-storefront-theme={a.theme}
			data-density={a.density}
			aria-label={t.left}
		>
			<label>
				{t.left}<select disabled={!interactive} bind:value={leftPreset}>
					{@render presetOptions()}
				</select>
			</label>
			<div bind:this={left}>
				{@render shelf(a)}
			</div>
		</section>
		<section
			class="pane"
			data-storefront-theme={b.theme}
			data-density={b.density}
			aria-label={t.right}
		>
			<label>
				{t.right}<select disabled={!interactive} bind:value={rightPreset}>
					{@render presetOptions()}
				</select>
			</label>
			<div bind:this={right}>
				{@render shelf(b)}
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
		--shelf-cell-padding: 0.375rem;
		padding: 1rem;
		min-width: 0;
		border: 1px solid var(--seam, #e9e6dc);
	}
	.pane[data-density='compact'] {
		--shelf-cell-padding: 0.25rem;
	}
	.pane[data-density='spacious'] {
		--shelf-cell-padding: 0.75rem;
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
