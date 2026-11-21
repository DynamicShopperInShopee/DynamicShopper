<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Locale } from '../catalog';
	let {
		locale,
		reading = $bindable('standard'),
		separateApply,
		onreset,
		children
	}: {
		locale: Locale;
		reading?: string;
		separateApply: boolean;
		onreset: () => void;
		children: Snippet<[Snippet<[string]>]>;
	} = $props();
	let draftReading = $state('standard');
	let previousReading = $state<string>();
	const t = (en: string, th: string) => (locale === 'th' ? th : en);
	function apply() {
		if (reading === draftReading) return;
		previousReading = reading;
		reading = draftReading;
	}
</script>

{#snippet controls(block: string)}
	{#if block === 'preferences'}
		<label>
			{t('Reading style', 'รูปแบบการอ่าน')}<select bind:value={draftReading}>
				<option value="standard">{t('Standard', 'มาตรฐาน')}</option><option value="large">
					{t('Large print', 'ตัวอักษรใหญ่')}
				</option>
			</select>
		</label>
		{#if !separateApply}<button disabled={draftReading === reading} onclick={apply}>
				{t('Apply reading style', 'ใช้รูปแบบการอ่าน')}
			</button>{/if}
	{:else if block === 'apply'}
		<p>{t('Review your reading choice before applying.', 'ตรวจรูปแบบการอ่านที่เลือกก่อนใช้')}</p>
		<button disabled={draftReading === reading} onclick={apply}>
			{t('Apply reading style', 'ใช้รูปแบบการอ่าน')}
		</button>
	{:else if block === 'undo'}
		<div class="actions">
			<button
				disabled={previousReading === undefined}
				onclick={() => {
					reading = previousReading ?? 'standard';
					draftReading = reading;
					previousReading = undefined;
				}}
			>
				{t('Undo', 'ย้อนกลับ')}
			</button><button
				onclick={() => {
					onreset();
					reading = 'standard';
					draftReading = 'standard';
					previousReading = undefined;
				}}
			>
				{t('Reset', 'คืนค่า')}
			</button>
		</div>
	{/if}
{/snippet}
{@render children(controls)}

<style>
	label {
		display: grid;
		gap: 8px;
	}
	select,
	button {
		font: inherit;
		min-height: var(--tap, 44px);
		max-width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--muted);
		background: var(--surface);
		color: var(--ink);
		padding: 10px 12px;
		border-radius: var(--radius);
	}
	button {
		cursor: pointer;
		text-align: start;
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
