<script lang="ts">
	import { formatNumber } from '../../../lib/store-search';
	import type { riceCookerSpecs } from '../../../lib/store-catalog';

	let { specs, th }: { specs: (typeof riceCookerSpecs)[string]; th: boolean } = $props();
	const fields = $derived([
		{ key: 'capacity', label: th ? 'ความจุ' : 'Capacity', unit: th ? 'ลิตร' : 'L' },
		{ key: 'power', label: th ? 'กำลังไฟ' : 'Power', unit: th ? 'วัตต์' : 'W' },
		{ key: 'programs', label: th ? 'โปรแกรมหุง' : 'Cooking programs', unit: '' },
		{
			key: 'warranty',
			label: th ? 'การรับประกัน' : 'Warranty',
			unit: th ? 'ปี' : specs[3] === 1 ? 'year' : 'years'
		}
	]);
</script>

<dl>
	{#each fields as field, index (field.key)}
		<div>
			<dt>{field.label}</dt>
			<dd data-fact={field.key} data-raw={specs[index]}>
				{formatNumber(specs[index])}{field.unit ? ` ${field.unit}` : ''}
			</dd>
		</div>
	{/each}
</dl>

<style>
	dl div {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e9e6dc;
	}
	dd {
		margin: 0;
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
	}
</style>
