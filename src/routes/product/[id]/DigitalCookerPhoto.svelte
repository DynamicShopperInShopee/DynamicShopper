<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PageData } from './$types';
	import ListingFactRows from './ListingFactRows.svelte';

	let {
		id,
		src,
		alt,
		width,
		height,
		title,
		icon,
		overlay,
		summary,
		rows = []
	}: {
		id: string;
		src: string;
		alt: string;
		width: number;
		height: number;
		title: string | PageData['name'];
		icon?: Snippet;
		overlay?: Snippet;
		summary?: PageData['summary'];
		rows?: readonly (PageData['specs'][number] | undefined)[];
	} = $props();
</script>

<figure class="m-0 scroll-mt-20" {id}>
	<figcaption
		class={['border-t border-[var(--detail-seam)] py-[0.85em_0.55em] [&_dl]:mt-[0.45em]']}
	>
		<div class="caption-title flex items-center gap-[0.5em]">
			{@render icon?.()}
			{#if typeof title === 'string'}
				<h3 class="m-0 text-[1.25em] leading-[1.35] font-semibold text-balance">{title}</h3>
			{:else}
				<h3
					class="m-0 text-[1.25em] leading-[1.35] font-semibold text-balance"
					{...title.attributes}
				>
					{title.text}
				</h3>
			{/if}
		</div>
		{#if summary}
			<p class="mx-0 mt-[0.45em] mb-0 text-[var(--detail-muted)]" {...summary.attributes}>
				{summary.text}
			</p>
		{/if}
		{#if rows.length}
			<ListingFactRows {rows} />
		{/if}
	</figcaption>
	<div
		class={[
			'photo relative [&>svg]:pointer-events-none [&>svg]:absolute [&>svg]:inset-0 [&>svg]:size-full'
		]}
	>
		<img
			class="block h-auto w-full bg-[var(--detail-seam)]"
			{src}
			{alt}
			{width}
			{height}
			loading="lazy"
		/>
		{@render overlay?.()}
	</div>
</figure>
