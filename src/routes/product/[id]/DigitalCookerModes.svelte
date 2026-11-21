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
			{#if programCount}
				<span {...programCount.attributes}>{programCount.text}</span>
			{/if}
			{th ? 'โหมดการปรุง' : 'cooking modes'}
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
	section {
		padding: 0.7em 0 0.5em;
		background: var(--detail-panel);
		scroll-margin-top: 5rem;
	}
	h3 {
		margin: 0 0 0.3em;
		font-size: 1.45em;
		font-weight: 600;
		text-align: center;
	}
	h3 span {
		font-family: var(--product-figure-font);
	}
	ul {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.42em;
		min-block-size: 6rem;
		padding: 0.55em 0.2em;
		line-height: 1.35;
		text-align: center;
		text-wrap: balance;
		overflow-wrap: anywhere;
	}
	li :global(svg) {
		color: var(--detail-muted);
	}
</style>
