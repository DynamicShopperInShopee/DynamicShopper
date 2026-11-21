<script lang="ts">
	import type { ShopperPlan } from '../personalization/plan';
	import type { Answers } from '../personalization/interview';
	import InterviewWizard from './InterviewWizard.svelte';
	import InterviewSheet from './InterviewSheet.svelte';
	import { tick } from 'svelte';
	let {
		plan,
		answers,
		applied,
		disabled,
		compact = false,
		onapply,
		onchat,
		onundo
	}: {
		plan: ShopperPlan;
		answers: Answers | null;
		applied: boolean;
		disabled: boolean;
		compact?: boolean;
		onapply: (answers: Answers) => void;
		onchat: () => void;
		onundo?: () => void;
	} = $props();
	let open = $state(false);
	const th = $derived(plan.locale === 'th');

	async function undoFromShelf(event: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const button = event.currentTarget;
		const shelf = button.closest<HTMLElement>('#products');
		onundo?.();
		await tick();
		if (!button.isConnected) shelf?.focus({ preventScroll: true });
	}
</script>

<section
	class="interview-entry"
	class:compact
	aria-label={th ? 'เลือกวิธีดูสินค้า' : 'Make the store fit you'}
>
	<div class="copy">
		<h2>
			{applied
				? th
					? 'ปรับมุมมองตามคำตอบแล้ว'
					: 'Your preferences are applied'
				: th
					? 'เลือกรูปแบบและขนาดตัวอักษร'
					: 'Choose your layout and text size'}
		</h2>
		{#if !compact && !applied}
			<p>
				{th
					? 'เลือกข้อมูลที่อยากเห็นก่อน แล้วดูตัวอย่างก่อนใช้'
					: 'Choose which details come first and preview the result.'}
			</p>
		{/if}
	</div>
	<div class="actions">
		{#if applied}<button class="primary" type="button" onclick={onchat}>
				{th ? 'แชตปรับมุมมองต่อ' : 'Refine this view in chat'}
			</button>{/if}
		<button
			class:primary={!applied}
			type="button"
			{disabled}
			aria-haspopup="dialog"
			onclick={(event) => {
				event.currentTarget.focus({ preventScroll: true });
				open = true;
			}}
		>
			{answers
				? th
					? 'แก้คำตอบของฉัน'
					: 'Edit my answers'
				: th
					? 'เริ่มตอบคำถามสั้น ๆ'
					: 'Start a quick interview'}
		</button>
		{#if applied}
			<button type="button" disabled={!onundo} onclick={undoFromShelf}>
				{th ? 'ย้อนกลับ' : 'Undo'}
			</button>
		{/if}
	</div>
</section>

{#if open}
	<InterviewSheet
		title={th ? 'ปรับร้านให้เหมาะกับคุณ' : 'Make the shop fit you'}
		closeLabel={th ? 'ปิดแบบสอบถาม' : 'Close interview'}
		onclose={() => (open = false)}
	>
		<InterviewWizard
			view={{ plan, interview: answers ? { answers } : null }}
			onapply={(next: Answers) => {
				open = false;
				onapply(next);
			}}
		/>
	</InterviewSheet>
{/if}

<style>
	.interview-entry {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.625rem 1.25rem;
		padding: 0.875rem 1rem;
		margin-block: 0.75rem;
		border-block: 1px solid var(--seam);
		background: var(--surface);
	}
	.copy {
		min-width: 0;
	}
	h2 {
		margin: 0;
		font-size: var(--size);
		line-height: 1.4;
		font-weight: 600;
	}
	p {
		margin: 0.2rem 0 0;
		color: var(--muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.625rem;
	}
	button {
		font: inherit;
		font-weight: 600;
		min-height: var(--tap);
		padding-inline: 0.8rem;
		color: var(--ink);
		background: var(--surface);
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		cursor: pointer;
	}
	button.primary {
		color: white;
		background: var(--accent);
		border-color: var(--accent);
	}
	button:hover:enabled {
		border-color: var(--ink);
	}
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.compact {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.75rem;
		margin: 0;
		padding: 0.5rem 0.75rem;
	}
	.compact button {
		font-size: var(--small);
	}
	@media (max-width: 520px) {
		.interview-entry:not(.compact) .actions {
			width: 100%;
		}
	}
</style>
