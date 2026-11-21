<script lang="ts">
	import type { PageData } from './$types';

	let {
		items,
		count,
		src,
		th
	}: {
		items: NonNullable<PageData['listingDetails']>['packageItems'];
		count: NonNullable<PageData['listingDetails']>['packageCount'];
		src: string;
		th: boolean;
	} = $props();
</script>

{#if items.length}
	<section id="digital-package" aria-labelledby="digital-package-title">
		<h3 id="digital-package-title">
			{th ? 'อุปกรณ์ในกล่อง' : 'In the box'}
			{#if count}
				<span {...count.attributes}>{count.text}</span>
			{/if}
		</h3>
		<img {src} alt="" width="1260" height="840" loading="lazy" />
		<ul>
			{#each items as item (item.attributes['data-fact'])}
				<li {...item.attributes}>{item.text}</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	section {
		padding: 0.75em 4% 0.7em;
		background: var(--detail-panel);
		scroll-margin-top: 5rem;
	}
	h3 {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: end;
		gap: 0.25em 0.5em;
		margin: 0 0 0.45em;
		font-size: 1.25em;
		font-weight: 600;
	}
	h3 span {
		font-family: var(--product-figure-font);
	}
	img {
		display: block;
		width: 100%;
		height: auto;
	}
	ul {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.2em 0.45em;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		padding-block: 0.25em;
		text-align: center;
		text-wrap: balance;
		overflow-wrap: anywhere;
	}
</style>
