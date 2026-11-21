<script lang="ts">
	import type { PageData } from './$types';
	import CookerModeIcon from './CookerModeIcon.svelte';

	let {
		modes,
		programCount,
		th
	}: {
		modes: NonNullable<PageData['listingDetails']>['modes'];
		programCount?: PageData['specs'][number];
		th: boolean;
	} = $props();
</script>

{#if modes.length}
	<section id="digital-modes" aria-labelledby="digital-modes-title">
		<h3 class="mx-0 mt-0 mb-[0.45em] flex flex-wrap items-baseline justify-between gap-x-[0.75em] gap-y-[0.25em] text-[1.25em] font-semibold" id="digital-modes-title">
			{th ? 'โหมดการปรุง' : 'Cooking modes'}
			{#if programCount}
				<span {...programCount class="font-[family-name:var(--product-figure-font)]".attributes}>{programCount.text}</span>
			{/if}
		</h3>
		<ul class="m-0 grid list-none grid-cols-3 border-s border-t border-[var(--detail-seam)] p-0">
			{#each modes as mode (mode.attributes['data-fact'])}
				<li class="flex flex-col items-center justify-center gap-[0.3em] border-e border-b border-[var(--detail-seam)] px-[0.3em] py-[0.75em] text-center leading-[1.35] text-balance wrap-anywhere">
					<CookerModeIcon field={mode.attributes['data-fact']} />
					<span {...mode.attributes}>{mode.text}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}
