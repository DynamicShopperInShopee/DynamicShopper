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

<div class="compare grid min-w-0 gap-4" lang={locale}>
	<CompareSlip {left} {right} leftLocale={a.locale} rightLocale={b.locale} {locale} {resolve} />
	<div class="panes grid grid-cols-2 gap-4 [@media(max-width:640px)]:grid-cols-1">
		<section
			class="pane min-w-0 border border-[var(--seam,#e9e6dc)] p-4 [--shelf-cell-padding:0.375rem] data-[density=compact]:[--shelf-cell-padding:0.25rem] data-[density=spacious]:[--shelf-cell-padding:0.75rem]"
			data-storefront-theme={a.theme}
			data-density={a.density}
			aria-label={t.left}
		>
			<label class="mb-3 grid gap-1.5">
				{t.left}<select
					class="min-h-[var(--tap,44px)] min-w-0 border border-current bg-[var(--surface,#fff)] px-2.5 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
					disabled={!interactive}
					bind:value={leftPreset}
				>
					{@render presetOptions()}
				</select>
			</label>
			<div bind:this={left}>
				{@render shelf(a)}
			</div>
		</section>
		<section
			class="pane min-w-0 border border-[var(--seam,#e9e6dc)] p-4 [--shelf-cell-padding:0.375rem] data-[density=compact]:[--shelf-cell-padding:0.25rem] data-[density=spacious]:[--shelf-cell-padding:0.75rem]"
			data-storefront-theme={b.theme}
			data-density={b.density}
			aria-label={t.right}
		>
			<label class="mb-3 grid gap-1.5">
				{t.right}<select
					class="min-h-[var(--tap,44px)] min-w-0 border border-current bg-[var(--surface,#fff)] px-2.5 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
					disabled={!interactive}
					bind:value={rightPreset}
				>
					{@render presetOptions()}
				</select>
			</label>
			<div bind:this={right}>
				{@render shelf(b)}
			</div>
		</section>
	</div>
</div>
