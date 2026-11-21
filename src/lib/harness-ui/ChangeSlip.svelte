<script lang="ts">
	import { formatBaht } from '#lib/catalog/index.ts';
	import type { ChangeLine, Language } from '#lib/harness/index.ts';
	let {
		lines,
		lang
	}: { lines: readonly (ChangeLine & { amount?: number; query?: string })[]; lang: Language } =
		$props();
</script>

{#if lines.length}<section
		class="slip my-4 border-y border-dashed border-current py-4"
		aria-label={lang === 'th' ? 'สิ่งที่เปลี่ยน' : 'What changed'}
	>
		<h3 class="m-0 mb-2 text-[1em]">{lang === 'th' ? 'สิ่งที่เปลี่ยน' : 'What changed'}</h3>
		{#each lines as line (line.part)}<p class="mx-0 my-1">
				{line.text}{#if line.amount !== undefined}
					<span data-preference="budget" data-raw={line.amount}>
						{formatBaht(line.amount, lang)}
					</span>{/if}{#if line.query}
					<span> {line.query}</span>{/if}
			</p>{/each}
	</section>{/if}
