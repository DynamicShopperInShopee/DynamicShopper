<script lang="ts">
	import type { PageData } from './$types';

	let { rows }: { rows: readonly (PageData['specs'][number] | undefined)[] } = $props();
</script>

<dl>
	{#each rows as row, index (row?.attributes['data-fact'] ?? index)}
		{#if row}
			<div>
				<dt>{row.label}</dt>
				<dd
					class:figure={Number.isFinite(Number(row.attributes['data-raw'])) ||
						row.attributes['data-fact'] === 'detail.voltage'}
					{...row.attributes}
				>
					{row.text}
				</dd>
			</div>
		{/if}
	{/each}
</dl>

<style>
	dl {
		margin: 0;
	}
	dl div {
		display: grid;
		grid-template-columns: minmax(0, 38%) minmax(0, 1fr);
		gap: 0.75em;
		padding-block: 0.5em;
		border-top: 1px solid var(--detail-seam);
		line-height: 1.5;
		overflow-wrap: anywhere;
	}
	dt {
		color: var(--detail-muted);
	}
	dd {
		margin: 0;
	}
	dd.figure {
		font-family: var(--product-figure-font);
	}
</style>
