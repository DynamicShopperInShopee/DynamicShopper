<script lang="ts">
	let { name, size = 22 }: { name: string; size?: number } = $props();
	const paths: Record<string, string> = {
		search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
		bag: 'M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
		chat: 'M4 4h16v13H9l-5 4V4Z',
		save: 'M6 3h12v18l-6-4-6 4V3Z',
		grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
		list: 'M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1',
		filter: 'M4 7h16M4 17h16M8 4v6M16 14v6',
		shirt: 'm8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4c0 4-8 4-8 0Z',
		kitchen: 'M3 12a9 9 0 0 0 18 0H3Zm9 9v-2M3 8h18M8 5V2M16 5V2',
		spark: 'm12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z',
		compare: 'M4 5h6v15H4V5Zm10-2h6v17h-6V3Z',
		arrow: 'M4 12h16m-6-6 6 6-6 6',
		close: 'm6 6 12 12M18 6 6 18',
		check: 'm4 12 5 5L20 6',
		home: 'm2 10 10-8 10 8M5 8v13h14V8M9 21v-7h6v7'
	};
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.6"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={paths[name] ?? paths.grid} />
</svg>
