<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { products } from '../lib/catalog';
	import type { Category, Language } from '../lib/store-catalog';
	import { categories } from '../lib/store-catalog';
	import FactValue from '../lib/storefront/FactValue.svelte';

	let {
		language,
		cooker,
		category,
		capacity = $bindable(),
		freeShipping,
		toggleShipping,
		openFilters,
		changeCategory,
		toggleLanguage,
		shoppingTasks,
		harnessLink
	}: {
		language: Language;
		cooker: boolean;
		category: Category | 'all';
		capacity?: number;
		freeShipping: boolean;
		toggleShipping: () => void;
		openFilters: (trigger: HTMLButtonElement) => void;
		changeCategory: (value: Category | 'all') => void;
		toggleLanguage: () => void;
		shoppingTasks?: Snippet;
		harnessLink?: Snippet;
	} = $props();
	const th = $derived(language === 'th');
	const label = $derived(
		cooker
			? th
				? 'ตัวกรองหม้อหุงข้าว'
				: 'Rice cooker filters'
			: th
				? 'ตัวกรองสกินแคร์'
				: 'Skincare filters'
	);
	let scrollY = $state(0);
	let strip: HTMLDivElement;
	let previousMode: boolean | undefined;
	$effect(() => {
		if (strip && previousMode !== cooker) strip.scrollLeft = 0;
		previousMode = cooker;
	});
	const sizes = new SvelteMap<number, string>();
	for (const item of products) {
		if (item.category !== 'rice-cooker') continue;
		const volume = item.specs.capacity;
		if (typeof volume === 'number' && !sizes.has(volume)) sizes.set(volume, item.id);
	}
</script>

<svelte:window bind:scrollY />
<nav class:condensed={scrollY > 180} class:single-row={!cooker} aria-label={label}>
	<div class="chips" bind:this={strip}>
		<button type="button" aria-pressed={freeShipping} onclick={toggleShipping}>
			<svg
				width="17"
				height="17"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				aria-hidden="true"
			>
				<path d="M2 6h12v11H2zM14 10h4l4 4v3h-8" /><circle cx="6" cy="18" r="2" /><circle
					cx="18"
					cy="18"
					r="2"
				/>
			</svg>
			{th ? 'ส่งฟรี' : 'Free shipping'}
		</button>
		<label class="category">
			{th ? 'หมวดหมู่' : 'Categories'}
			<svg
				width="14"
				height="14"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path d="m3 6 5 5 5-5" />
			</svg>
			<select
				aria-label={th ? 'หมวดหมู่' : 'Categories'}
				value={category}
				onchange={(event) => changeCategory(event.currentTarget.value as Category | 'all')}
			>
				<option value="all">{th ? 'ทั้งหมด' : 'All'}</option>
				{#each Object.entries(categories) as [key, labels] (key)}
					<option value={key}>{labels[language]}</option>
				{/each}
			</select>
		</label>
		{#if cooker}
			{#each sizes as [volume, id] (volume)}
				<button
					type="button"
					aria-pressed={capacity === volume}
					onclick={() => (capacity = capacity === volume ? undefined : volume)}
				>
					<FactValue productId={id} field="spec.capacity" locale={language} />
				</button>
			{/each}
		{/if}
		<button type="button" lang={th ? 'en' : 'th'} onclick={toggleLanguage}>
			{th ? 'English' : 'ไทย'}
		</button>
		<a href={resolve('/?view=receipt#assistant')}>{th ? 'ผู้ช่วยช้อปปิ้ง' : 'Shopping assistant'}</a>
		{@render shoppingTasks?.()}
		{@render harnessLink?.()}
	</div>
	{#if cooker}
		<button
			class="filters"
			type="button"
			aria-haspopup="dialog"
			onclick={(event) => openFilters(event.currentTarget)}
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				aria-hidden="true"
			>
				<path d="M3 5h18l-7 8v6l-4 2v-8z" />
			</svg>
			{th ? 'ตัวกรอง' : 'Filters'}
		</button>
	{/if}
</nav>

<style>
	nav {
		position: sticky;
		top: calc(var(--tap) + 0.75rem);
		z-index: 2;
		display: flex;
		align-items: flex-start;
		min-width: 0;
		background: var(--surface);
		border-block: 1px solid var(--seam);
	}
	.chips {
		flex: 1;
		min-width: 0;
		display: grid;
		grid-auto-flow: column;
		grid-template-rows: repeat(2, auto);
		grid-auto-columns: max-content;
		gap: 0.2rem 0.45rem;
		overflow-x: auto;
		overscroll-behavior-inline: contain;
		scrollbar-width: none;
		padding: 0.3rem 0.5rem;
	}
	button,
	.category,
	a {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		min-height: var(--tap);
		padding-inline: 0.65rem;
		white-space: nowrap;
		color: var(--ink);
		background: var(--paper);
		border-radius: var(--radius);
		font-size: var(--small);
		border: 1px solid transparent;
		cursor: pointer;
	}
	button[aria-pressed='true'] {
		border-color: var(--accent);
		color: var(--accent);
		font-weight: 600;
	}
	.category {
		position: relative;
	}
	select {
		position: absolute;
		inset: 0;
		width: 100%;
		opacity: 0;
		cursor: pointer;
	}
	.category:focus-within,
	:is(a, button):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	.filters {
		position: sticky;
		right: 0;
		flex-direction: column;
		gap: 0;
		min-width: var(--tap);
		align-self: stretch;
		padding-inline: 0.4rem;
		background: var(--surface);
		border-radius: 0;
		border-inline-start-color: var(--seam);
		font-weight: 600;
	}
	button :global([data-fact]) {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace;
	}
	.single-row .chips {
		grid-template-rows: auto;
	}
	@media (max-width: 699px) {
		.condensed .chips {
			grid-template-rows: auto;
		}
	}
</style>
