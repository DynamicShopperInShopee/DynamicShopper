<script lang="ts">
	import type { PageData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: PageData; children: Snippet } = $props();
	const th = $derived(data.language === 'th');
	const highlights = $derived(
		data.category === 'rice-cooker'
			? data.specs.filter((spec) =>
					['spec.capacity', 'spec.warranty'].includes(spec.attributes['data-fact'])
				)
			: []
	);
</script>

<section
	class="product-summary min-w-0 [--inset:0.8rem] [--summary-seam:var(--seam,#e9e6dc)] min-[700px]:[--inset:1.25rem]"
	aria-labelledby="product-title"
>
	<dl
		class="prices m-0 flex flex-wrap items-baseline gap-x-[0.45rem] gap-y-1 px-[var(--inset)] pt-[0.8rem] pb-2 min-[700px]:pt-5"
	>
		<div>
			<dt class="sr-only">{th ? 'ราคา' : 'Price'}</dt>
			<dd
				class="current m-0 font-[family-name:var(--product-figure-font)] text-[1.5em] leading-[1.12] font-bold tracking-[-0.04em] tabular-nums min-[700px]:text-[1.875em]"
				{...data.price.attributes}
			>
				{data.price.text}
			</dd>
		</div>
		{#if data.originalPrice}
			<div>
				<dt class="sr-only">{th ? 'ราคาเดิม' : 'Original price'}</dt>
				<dd
					class="original m-0 font-[family-name:var(--product-figure-font)] text-[max(0.875rem,var(--action-font-floor,0rem))] text-[#5d5d63] tabular-nums"
					{...data.originalPrice.attributes}
				>
					<s>{data.originalPrice.text}</s>
				</dd>
			</div>
		{/if}
		<div
			class="sold ms-auto flex flex-wrap items-baseline gap-x-[0.45rem] gap-y-1 text-[max(0.875rem,var(--action-font-floor,0rem))]"
		>
			<dt>{th ? 'ขายแล้ว' : 'Sold'}</dt>
			<dd
				class="m-0 font-[family-name:var(--product-figure-font)] tabular-nums"
				{...data.sold.attributes}
			>
				{data.sold.text}
			</dd>
		</div>
	</dl>
	{#if highlights.length}
		<dl
			class="highlights m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1 px-[var(--inset)] pt-[0.15rem] pb-3 text-[max(0.875rem,var(--action-font-floor,0rem))]"
		>
			{#each highlights as spec (spec.attributes['data-fact'])}
				<div class="flex flex-wrap items-baseline gap-x-[0.45rem] gap-y-1">
					<dt class="text-[#5d5d63]">{spec.label}</dt>
					<dd
						class="m-0 font-[family-name:var(--product-figure-font)] tabular-nums"
						{...spec.attributes}
					>
						{spec.text}
					</dd>
				</div>
			{/each}
		</dl>
	{/if}
	<div
		class={[
			'deal relative border-y border-[var(--summary-seam)] bg-[var(--deal-ground,#fbfbf8)] px-[var(--inset)] [&_.actions>button]:flex-1 [&_.actions>button]:bg-transparent [&_.actions>button]:py-2 [&_.actions>button]:pr-[1.7rem] [&_.actions>button]:pl-0 [&_.actions>button]:text-start [&_.actions>button]:font-semibold [&_.actions>button]:[border:0]'
		]}
	>
		{@render children()}
		<svg
			class="deal-arrow pointer-events-none absolute end-[var(--inset)] top-4"
			aria-hidden="true"
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<path d="m6 3 5 5-5 5" />
		</svg>
	</div>
	<h1
		class="m-0 grid min-h-15 content-center px-[var(--inset)] py-[0.8rem] text-[max(1.0625rem,var(--action-font-floor,0rem))] leading-[1.4] font-normal wrap-anywhere"
		id="product-title"
		{...data.name.attributes}
	>
		{data.name.text}
	</h1>
	<dl
		class="delivery m-0 grid min-h-[5.6rem] content-center gap-1 border-t border-[var(--summary-seam)] px-[var(--inset)] py-3"
	>
		<dt class="flex items-center gap-[0.55rem] font-semibold">
			<svg
				aria-hidden="true"
				width="21"
				height="21"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8" />
				<circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
			</svg>
			{th ? 'ค่าจัดส่ง' : 'Shipping'}
		</dt>
		<dd
			class="my-0 ms-[calc(21px+0.55rem)] me-0 font-[family-name:var(--product-figure-font)] tabular-nums"
			{...data.shipping.attributes}
		>
			{data.shipping.text}
		</dd>
	</dl>
</section>
