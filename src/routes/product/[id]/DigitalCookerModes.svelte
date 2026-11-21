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
		<h3 id="digital-modes-title">
			{th ? 'โหมดการปรุง' : 'Cooking modes'}
			{#if programCount}
				<span {...programCount.attributes}>{programCount.text}</span>
			{/if}
		</h3>
		<ul>
			{#each modes as mode (mode.attributes['data-fact'])}
				<li>
					<CookerModeIcon field={mode.attributes['data-fact']} />
					<span {...mode.attributes}>{mode.text}</span>
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
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--detail-seam);
		border-inline-start: 1px solid var(--detail-seam);
		list-style: none;
	}
	li {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.3em;
		padding: 0.75em 0.3em;
		border-inline-end: 1px solid var(--detail-seam);
		border-bottom: 1px solid var(--detail-seam);
		line-height: 1.35;
		text-align: center;
		text-wrap: balance;
		overflow-wrap: anywhere;
	}
</style>
