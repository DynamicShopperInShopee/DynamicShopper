<script lang="ts">
	import type { PageData } from './$types';

	let { rows }: { rows: readonly (PageData['specs'][number] | undefined)[] } = $props();
</script>

<dl class="m-0">
	{#each rows as row, index (row?.attributes['data-fact'] ?? index)}
		{#if row}
			<div
				class="grid grid-cols-[minmax(0,38%)_minmax(0,1fr)] gap-[0.75em] border-t border-[var(--detail-seam)] py-[0.5em] leading-normal wrap-anywhere"
			>
				<dt class="text-[var(--detail-muted)]">{row.label}</dt>
				<dd
					class={['m-0 [&.figure]:font-[family-name:var(--product-figure-font)]']}
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
