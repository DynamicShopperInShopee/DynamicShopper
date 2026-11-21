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
		<h3 class="mx-0 mt-0 mb-[0.45em] flex flex-wrap items-baseline justify-between gap-x-[0.75em] gap-y-[0.25em] text-[1.25em] font-semibold" id="digital-package-title">
			{th ? 'อุปกรณ์ในกล่อง' : 'In the box'}
			{#if count}
				<span {...count class="font-[family-name:var(--product-figure-font)]".attributes}>{count.text}</span>
			{/if}
		</h3>
		<ul class="m-0 grid list-none grid-cols-3 gap-x-[0.45em] gap-y-[0.7em] p-0">
			{#each items as item (item.attributes['data-fact'])}
				<li  class="group/part text-center text-balance wrap-anywhere"data-part={item.attributes['data-fact']}>
					<div class="part-photo relative aspect-square overflow-hidden bg-[var(--detail-seam)]">
						<img  class="absolute top-0 left-0 h-[200%] w-[300%] max-w-none group-data-[part=detail.part.innerPot]/part:-left-full group-data-[part=detail.part.powerCord]/part:-top-full group-data-[part=detail.part.powerCord]/part:-left-full group-data-[part=detail.part.ricePaddle]/part:-left-[200%] group-data-[part=detail.part.manual]/part:-top-full group-data-[part=detail.part.manual]/part:-left-[200%] group-data-[part=detail.part.measuringCup]/part:-top-full"{src} alt="" width="1260" height="840" loading="lazy" />
					</div>
					<span {...item class="block py-[0.3em]".attributes}>{item.text}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}
