<script lang="ts">
	import { formatBaht } from '#lib/catalog/index.ts';
	import type { ChangeLine, Language } from '#lib/harness/index.ts';
	let {
		lines,
		lang
	}: { lines: readonly (ChangeLine & { amount?: number; query?: string })[]; lang: Language } =
		$props();
</script>

{#if lines.length}<section class="slip" aria-label={lang === 'th' ? 'สิ่งที่เปลี่ยน' : 'What changed'}>
		<h3>{lang === 'th' ? 'สิ่งที่เปลี่ยน' : 'What changed'}</h3>
		{#each lines as line (line.part)}<p>
				{line.text}{#if line.amount !== undefined}
					<span data-preference="budget" data-raw={line.amount}>
						{formatBaht(line.amount, lang)}
					</span>{/if}{#if line.query}
					<span> {line.query}</span>{/if}
			</p>{/each}
	</section>{/if}

<style>
	.slip {
		border-block: 1px dashed currentColor;
		padding-block: 1rem;
		margin-block: 1rem;
	}
	h3 {
		font-size: 1em;
		margin: 0 0 0.5rem;
	}
	p {
		margin: 0.25rem 0;
	}
</style>
