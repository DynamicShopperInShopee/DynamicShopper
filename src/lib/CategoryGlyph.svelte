<script lang="ts">
	import type { Category } from './store-catalog';

	let { category }: { category: Category } = $props();
</script>

<svg
	viewBox="0 0 96 96"
	class="block w-[min(70%,5.75rem)]"
	aria-hidden="true"
	fill="none"
	stroke="currentColor"
	stroke-width="3"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	{#if category === 'mouse'}
		<rect x="27" y="13" width="42" height="69" rx="21" />
		<path d="M27 42h42M48 14v28M43 57h10" />
	{:else if category === 'earbuds'}
		<path
			d="M28 52c-8 0-13-6-13-14s5-14 13-14c9 0 15 6 15 14 0 7-4 11-9 13v19h-8V52M68 52c8 0 13-6 13-14s-5-14-13-14c-9 0-15 6-15 14 0 7 4 11 9 13v19h8V52M22 36l6 2m46-2-6 2"
		/>
	{:else if category === 'power'}
		<rect x="17" y="29" width="62" height="38" rx="8" />
		<path d="M79 41h5v14h-5M49 36l-8 13h12l-8 12" />
	{:else if category === 'cooker'}
		<path
			d="M19 44h58v17a12 12 0 0 1-12 12H31a12 12 0 0 1-12-12zM16 44h64M23 44a25 25 0 0 1 50 0M41 20h14M26 73v4m44-4v4"
		/>
		<circle cx="48" cy="58" r="4" />
	{:else}
		<rect x="32" y="40" width="32" height="39" rx="6" />
		<path d="M40 40V29h16v11M48 29V17h13M39 59h18" />
	{/if}
</svg>

