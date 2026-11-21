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

<label
	class="relative grid min-h-[var(--tap)] flex-[0_0_var(--tap)] place-items-center rounded-[var(--radius)] text-[var(--accent)] focus-within:outline-2 focus-within:outline-offset-[-2px] focus-within:outline-[var(--accent)] data-[active=true]:bg-[var(--paper)]"
	data-active={sort !== 'default'}
>
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
	<select
		class="absolute inset-0 size-full cursor-pointer opacity-0"
		aria-label={label}
		bind:value={sort}
	>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</label>
