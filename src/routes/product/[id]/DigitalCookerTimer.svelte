<script lang="ts">
	import type { PageData } from './$types';

	let { th, timer }: { th: boolean; timer?: PageData['specs'][number] } = $props();
</script>

{#if timer}
	<section id="digital-preset" aria-labelledby="digital-preset-title">
		<h3 id="digital-preset-title">
			{th ? 'ตั้งเวลาล่วงหน้า' : 'Preset timer'} <span {...timer.attributes}>{timer.text}</span>
		</h3>
		<svg
			viewBox="0 0 180 163"
			width="220"
			height="199"
			fill="none"
			stroke="currentColor"
			stroke-width="8"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M47 22a71 71 0 0 1 68-10m39 42a71 71 0 1 1-128 0M90 63v31l24 22" />
		</svg>
	</section>
{/if}

<style>
	section {
		display: grid;
		justify-items: center;
		padding: 1.1em 0.6em 1.35em;
		background: var(--detail-panel);
		text-align: center;
		scroll-margin-top: 5rem;
	}
	h3,
	svg {
		grid-area: 1 / 1;
	}
	h3 {
		z-index: 1;
		align-self: start;
		margin: clamp(1.6rem, 7vw, 2.4rem) 0 0;
		padding-inline: 0.25em;
		background: var(--detail-panel);
		font-size: 1.4em;
		font-weight: 600;
		line-height: 1.4;
		text-wrap: balance;
	}
	span {
		font-family: var(--product-figure-font);
		white-space: nowrap;
	}
	svg {
		width: min(63%, 17rem);
		height: auto;
		color: var(--detail-muted);
	}
	:global([data-theme='large']) h3 {
		grid-area: auto;
		margin: 0 0 0.5em;
		font-size: 1em;
	}
	:global([data-theme='large']) svg {
		grid-area: auto;
	}
</style>
