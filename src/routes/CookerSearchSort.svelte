<script lang="ts">
	import type { Sort } from '../lib/store-search';

	let {
		label,
		options,
		sort = $bindable()
	}: {
		label: string;
		options: { value: Sort; label: string }[];
		sort: Sort;
	} = $props();
</script>

<label data-active={sort !== 'default'}>
	<svg
		viewBox="0 0 24 24"
		width="22"
		height="22"
		fill="none"
		stroke="currentColor"
		stroke-width="1.6"
		aria-hidden="true"
	>
		<path d="M8 20V4m-4 4 4-4 4 4m4-4v16m-4-4 4 4 4-4" />
	</svg>
	<select aria-label={label} bind:value={sort}>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</label>

<style>
	label {
		position: relative;
		flex: 0 0 var(--tap);
		display: grid;
		place-items: center;
		min-height: var(--tap);
		border-radius: var(--radius);
		color: var(--accent);
	}
	label[data-active='true'] {
		background: var(--paper);
	}
	label:focus-within {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	select {
		position: absolute;
		inset: 0;
		width: 100%;
		opacity: 0;
		cursor: pointer;
	}
</style>
