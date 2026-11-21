<script lang="ts">
	import { riceCookerSpecs, type Language } from '../lib/store-catalog';
	import { formatNumber } from '../lib/store-search';

	let { language, capacity = $bindable() }: { language: Language; capacity: number | undefined } =
		$props();
	const options = [...new Set(Object.values(riceCookerSpecs).map(([size]) => size))];
</script>

{#each options as size (size)}
	<button
		type="button"
		aria-pressed={capacity === size}
		onclick={() => (capacity = capacity === size ? undefined : size)}
	>
		<span data-fact="capacity" data-raw={size}>
			{formatNumber(size)}
			{language === 'th' ? 'ลิตร' : 'L'}
		</span>
	</button>
{/each}

<style>
	button {
		flex: none;
		min-height: var(--tap);
		border: 1px solid transparent;
		border-radius: var(--radius);
		background: #f5f5f5;
		padding-inline: 0.65rem;
		color: var(--ink);
		font-size: var(--small);
		white-space: nowrap;
		cursor: pointer;
	}
	button[aria-pressed='true'] {
		color: var(--accent);
		border-color: var(--accent);
	}
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	span {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', ui-monospace, monospace;
	}
</style>
