<script lang="ts">
	let { field }: { field: string } = $props();
</script>

<svg
	aria-hidden="true"
	width="36"
	height="36"
	viewBox="0 0 32 32"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	{#if field === 'detail.mode.boil'}
		<path d="M7 13h18l-2 11H9L7 13Zm0 3H4m24 0h-3M6 13h20" />
		<circle cx="12" cy="8" r="1.5" />
		<circle cx="20" cy="6" r="2" />
	{:else if field === 'detail.mode.quickCook'}
		<circle cx="16" cy="18" r="9" />
		<path d="M13 5h6m-3 0v4m7 2 2-2m-9 4v5l3 2" />
	{:else if field === 'detail.mode.steam'}
		<path
			d="M5 19h22m-21 0 4 7h12l4-7M8 16h16M11 12c-3-3 2-3 0-6m5 6c-3-3 2-3 0-8m5 8c-3-3 2-3 0-6"
		/>
	{:else if field === 'detail.mode.porridge'}
		<path d="M5 17h22c-1 6-5 9-11 9S6 23 5 17Zm12 0 5-9 3 2-6 7M8 14l2-1m3 1 2-1" />
	{:else if field === 'detail.mode.soup'}
		<path d="M5 18h22c-1 5-5 8-11 8S6 23 5 18Zm3 0c0-3 1-5 3-6m5 2c2-2 0-4 1-6m3 6c2-1 3-3 2-5" />
	{:else if field === 'detail.mode.stew'}
		<path d="M6 15h20l-2 10H8L6 15Zm0 4H3m26 0h-3M5 15h22M8 12h16m-11 0V9h6v3" />
	{:else if field === 'detail.mode.yogurt'}
		<path d="M8 11h16l-3 15H11L8 11Zm3 4h10M7 11h18m-8 0 3-5 3 2-2 3" />
	{:else if field === 'detail.mode.cake'}
		<path d="M6 26h20M8 26V15h16v11M8 19c3 3 5-2 8 0s5 2 8 0m-8-4v-4m0-7c3 3 3 5 0 5s-3-2 0-5Z" />
	{:else if field === 'detail.mode.keepWarm'}
		<path d="M5 25h22M8 22a8 8 0 0 1 16 0H8Zm4-11c-2-2 1-3 0-5m4 6c-2-2 1-4 0-7m4 6c-2-2 1-3 0-5" />
	{/if}
</svg>
