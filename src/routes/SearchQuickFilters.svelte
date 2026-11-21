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
		toggleLanguage?: () => void;
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
<nav
	class="group/quick-filters sticky top-[calc(var(--tap)+0.75rem)] z-[2] flex min-w-0 items-start border-y border-[var(--seam)] bg-[var(--surface)]"
	class:condensed={scrollY > 180}
	class:single-row={!cooker}
	aria-label={label}
>
	<div
		class="chips grid min-w-0 flex-1 [scrollbar-width:none] auto-cols-max grid-flow-col grid-rows-[repeat(2,auto)] gap-x-[0.45rem] gap-y-[0.2rem] overflow-x-auto px-2 py-[0.3rem] [overscroll-behavior-inline:contain] group-[.single-row]/quick-filters:grid-rows-[auto] [@media(max-width:699px)]:group-[.condensed]/quick-filters:grid-rows-[auto]"
		bind:this={strip}
	>
		<button
			class="flex min-h-[var(--tap)] cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-transparent bg-[var(--paper)] px-[0.65rem] text-[length:var(--small)] whitespace-nowrap text-[var(--ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:font-semibold aria-pressed:text-[var(--accent)]"
			type="button"
			aria-pressed={freeShipping}
			onclick={toggleShipping}
		>
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
		<label
			class="category relative flex min-h-[var(--tap)] cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-transparent bg-[var(--paper)] px-[0.65rem] text-[length:var(--small)] whitespace-nowrap text-[var(--ink)] focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[var(--accent)]"
		>
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
				class="absolute inset-0 w-full cursor-pointer opacity-0"
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
					class={[
						"flex min-h-[var(--tap)] cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-transparent bg-[var(--paper)] px-[0.65rem] text-[length:var(--small)] whitespace-nowrap text-[var(--ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:font-semibold aria-pressed:text-[var(--accent)] [&_[data-fact]]:[font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace]"
					]}
					type="button"
					aria-pressed={capacity === volume}
					onclick={() => (capacity = capacity === volume ? undefined : volume)}
				>
					<FactValue productId={id} field="spec.capacity" locale={language} />
				</button>
			{/each}
		{/if}
		{#if toggleLanguage}
			<button
				class="flex min-h-[var(--tap)] cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-transparent bg-[var(--paper)] px-[0.65rem] text-[length:var(--small)] whitespace-nowrap text-[var(--ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]"
				type="button"
				lang={th ? 'en' : 'th'}
				onclick={toggleLanguage}
			>
				{th ? 'English' : 'ไทย'}
			</button>
		{/if}
		<a
			class="flex min-h-[var(--tap)] cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-transparent bg-[var(--paper)] px-[0.65rem] text-[length:var(--small)] whitespace-nowrap text-[var(--ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]"
			href={resolve('/?view=receipt#assistant')}
		>
			{th ? 'ผู้ช่วยช้อปปิ้ง' : 'Shopping assistant'}
		</a>
		{@render shoppingTasks?.()}
		{@render harnessLink?.()}
	</div>
	{#if cooker}
		<button
			class="filters sticky right-0 flex min-h-[var(--tap)] min-w-[var(--tap)] cursor-pointer flex-col items-center justify-center gap-0 self-stretch rounded-none border border-transparent [border-inline-start-color:var(--seam)] bg-[var(--surface)] px-[0.4rem] text-[length:var(--small)] font-semibold whitespace-nowrap text-[var(--ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]"
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
