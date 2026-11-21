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

<figure {id}>
	<figcaption>
		<div class="caption-title">
			{@render icon?.()}
			{#if typeof title === 'string'}
				<h3>{title}</h3>
			{:else}
				<h3 {...title.attributes}>{title.text}</h3>
			{/if}
		</div>
		{#if summary}
			<p {...summary.attributes}>{summary.text}</p>
		{/if}
		{#if rows.length}
			<ListingFactRows {rows} />
		{/if}
	</figcaption>
	<div class="photo">
		<img {src} {alt} {width} {height} loading="lazy" />
		{@render overlay?.()}
	</div>
</figure>

<style>
	figure {
		margin: 0;
		scroll-margin-top: 5rem;
	}
	figcaption {
		padding-block: 0.85em 0.55em;
		border-top: 1px solid var(--detail-seam);
	}
	.caption-title {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}
	h3 {
		margin: 0;
		font-size: 1.25em;
		font-weight: 600;
		line-height: 1.35;
		text-wrap: balance;
	}
	p {
		margin: 0.45em 0 0;
		color: var(--detail-muted);
	}
	figcaption :global(dl) {
		margin-top: 0.45em;
	}
	.photo {
		position: relative;
	}
	.photo > :global(svg) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	img {
		display: block;
		width: 100%;
		height: auto;
		background: var(--detail-seam);
	}
</style>
