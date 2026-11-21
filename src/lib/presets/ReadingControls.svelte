<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Locale } from '../catalog';

	type Block = 'preferences' | 'apply' | 'undo';
	let {
		locale,
		separateApply,
		resetCanvas,
		reading = $bindable('standard'),
		children
	}: {
		locale: Locale;
		separateApply: boolean;
		resetCanvas: () => void;
		reading?: string;
		children: Snippet<[Snippet<[Block]>]>;
	} = $props();

	let draft = $state('standard');
	let previous = $state<string>();
	const t = (en: string, th: string) => (locale === 'th' ? th : en);

	function apply() {
		if (draft === reading) return;
		previous = reading;
		reading = draft;
	}
	function undo() {
		if (previous === undefined) return;
		draft = reading = previous;
		previous = undefined;
	}
	function reset() {
		draft = reading = 'standard';
		previous = undefined;
		resetCanvas();
	}
</script>

{#snippet applyButton()}
	<button disabled={draft === reading} onclick={apply}>
		{t('Apply reading style', 'ใช้รูปแบบการอ่าน')}
	</button>
{/snippet}

{#snippet controls(block: Block)}
	{#if block === 'preferences'}
		<label>
			{t('Reading style', 'รูปแบบการอ่าน')}
			<select bind:value={draft}>
				<option value="standard">{t('Standard', 'มาตรฐาน')}</option>
				<option value="large">{t('Large print', 'ตัวอักษรใหญ่')}</option>
			</select>
		</label>
		{#if !separateApply}{@render applyButton()}{/if}
	{:else if block === 'apply'}
		<p>{t('Review your reading choice before applying.', 'ตรวจรูปแบบการอ่านที่เลือกก่อนใช้')}</p>
		{@render applyButton()}
	{:else}
		<div class="actions">
			<button disabled={previous === undefined} onclick={undo}>{t('Undo', 'ย้อนกลับ')}</button>
			<button onclick={reset}>{t('Reset', 'คืนค่า')}</button>
		</div>
	{/if}
{/snippet}

{@render children(controls)}

<style>
	label {
		display: grid;
		gap: 8px;
	}
	p {
		margin: 8px 0;
	}
	select,
	button {
		font: inherit;
		min-height: var(--tap, 44px);
		box-sizing: border-box;
		max-width: 100%;
		border: 1px solid var(--muted);
		background: var(--surface);
		color: var(--ink);
		padding: 10px 12px;
		border-radius: var(--radius);
	}
	button {
		cursor: pointer;
	}
	button:disabled {
		color: var(--muted);
		border-color: var(--seam);
		cursor: default;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}
	:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
</style>
