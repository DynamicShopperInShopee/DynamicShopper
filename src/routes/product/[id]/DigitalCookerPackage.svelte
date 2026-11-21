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
		<ul>
			{#each items as item (item.attributes['data-fact'])}
				<li data-part={item.attributes['data-fact']}>
					<div class="part-photo">
						<img {src} alt="" width="1260" height="840" loading="lazy" />
					</div>
					<span {...item.attributes}>{item.text}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	h3 {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25em 0.75em;
		margin: 0 0 0.45em;
		font-size: 1.25em;
		font-weight: 600;
	}
	h3 span {
		font-family: var(--product-figure-font);
	}
	ul {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.7em 0.45em;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		text-align: center;
		text-wrap: balance;
		overflow-wrap: anywhere;
	}
	li span {
		display: block;
		padding-block: 0.3em;
	}
	.part-photo {
		position: relative;
		aspect-ratio: 1;
		overflow: hidden;
		background: var(--detail-seam);
	}
	.part-photo img {
		position: absolute;
		top: 0;
		left: 0;
		width: 300%;
		height: 200%;
		max-width: none;
	}
	[data-part='detail.part.innerPot'] img,
	[data-part='detail.part.powerCord'] img {
		left: -100%;
	}
	[data-part='detail.part.ricePaddle'] img,
	[data-part='detail.part.manual'] img {
		left: -200%;
	}
	[data-part='detail.part.measuringCup'] img,
	[data-part='detail.part.powerCord'] img,
	[data-part='detail.part.manual'] img {
		top: -100%;
	}
</style>
