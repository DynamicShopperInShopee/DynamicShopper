<script lang="ts">
	import { formatNumber } from '../../../lib/store-search';

	let {
		specs,
		th,
		hasReview
	}: { specs: readonly [number, number, number, number]; th: boolean; hasReview: boolean } =
		$props();
	let sheet = $state<HTMLDialogElement>();
	const fields = $derived([
		{ key: 'capacity', label: th ? 'ความจุ' : 'Capacity', unit: th ? 'ลิตร' : 'L' },
		{ key: 'power', label: th ? 'กำลังไฟ' : 'Power', unit: th ? 'วัตต์' : 'W' },
		{ key: 'programs', label: th ? 'โปรแกรมหุง' : 'Cooking programs', unit: '' },
		{ key: 'warranty', label: th ? 'การรับประกัน' : 'Warranty', unit: th ? 'ปี' : 'years' }
	]);
</script>

<div class="actions">
	{#if hasReview}<a href="#reviews">{th ? 'รีวิว' : 'Reviews'}</a>{/if}
	<a href="#details">{th ? 'รายละเอียด' : 'Details'}</a>
	<button type="button" aria-haspopup="dialog" onclick={() => sheet?.showModal()}>
		{th ? 'สเปกสินค้า' : 'Specifications'}
	</button>
</div>

<dialog bind:this={sheet} aria-labelledby="specs-title">
	<h2 id="specs-title">{th ? 'สเปกสินค้า' : 'Specifications'}</h2>
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
	<form method="dialog"><button>{th ? 'ตกลง' : 'Done'}</button></form>
</dialog>

<style>
	.actions {
		position: sticky;
		display: flex;
		gap: 0;
		align-items: stretch;
		bottom: 0;
		border-top: 1px solid #e9e6dc;
		background: white;
		padding-bottom: env(safe-area-inset-bottom);
	}
	.actions button {
		flex: 2;
		width: auto;
		border-radius: 0;
	}
	.actions a {
		flex: 1;
		display: grid;
		place-items: center;
		border-inline-end: 1px solid #e9e6dc;
		min-height: 48px;
		padding: 0 0.4rem;
		color: inherit;
		text-align: center;
	}
	button {
		font: inherit;
		width: 100%;
		min-height: 48px;
		color: white;
		background: #16161a;
		border: 1px solid #16161a;
		border-radius: 4px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid #16161a;
		outline-offset: 2px;
	}
	dialog {
		width: min(100%, 36rem);
		max-width: 100%;
		max-height: 85dvh;
		box-sizing: border-box;
		margin: auto auto 0;
		border: 1px solid #e9e6dc;
		border-radius: 12px 12px 0 0;
		padding: 1rem;
		color: #16161a;
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}
	h2 {
		text-align: center;
		margin: 0;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e9e6dc;
	}
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
	@media (min-width: 700px) {
		dialog {
			margin: auto;
			border-radius: 8px;
		}
	}
</style>
