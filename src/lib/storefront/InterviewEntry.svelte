<script lang="ts">
	import type { ShopperPlan } from '../personalization/plan';
	import type { Answers } from '../personalization/interview';
	import InterviewWizard from './InterviewWizard.svelte';
	import InterviewSheet from './InterviewSheet.svelte';
	let {
		plan,
		themeLocked,
		answers,
		directOnly,
		applied,
		disabled,
		compact = false,
		onapply,
		onchat
	}: {
		plan: ShopperPlan;
		themeLocked: boolean;
		answers: Answers | null;
		directOnly: boolean;
		applied: boolean;
		disabled: boolean;
		compact?: boolean;
		onapply: (answers: Answers, directOnly: boolean) => void;
		onchat: () => void;
	} = $props();
	let open = $state(false);
	const th = $derived(plan.locale === 'th');
</script>

<section
	class="interview-entry"
	class:compact
	aria-label={th ? 'เลือกวิธีดูสินค้า' : 'Make the store fit you'}
>
	<div>
		<strong>
			{compact
				? th
					? 'มุมมองที่เหมาะกับคุณ'
					: 'Make it your view'
				: th
					? 'เลือกดูสินค้าในแบบของคุณ'
					: 'Shop in a way that fits you'}
		</strong>
		{#if !compact}<p>
				{applied
					? th
						? 'ใช้คำตอบของคุณแล้ว แชตปรับต่อหรือย้อนกลับได้เสมอ'
						: 'Your answers are applied. Refine them in chat or undo the change.'
					: th
						? 'ตอบสั้น ๆ เพื่อปรับมุมมอง แล้วแชตปรับต่อได้'
						: 'Start with a short interview, then fine-tune your view in chat.'}
			</p>{/if}
	</div>
	<div class="actions">
		<button type="button" {disabled} onclick={() => (open = true)}>
			{answers
				? th
					? 'แก้คำตอบของฉัน'
					: 'Edit my answers'
				: th
					? 'เริ่มตอบคำถามสั้น ๆ'
					: 'Start a quick interview'}
		</button>
		{#if applied}<button class="chat" type="button" onclick={onchat}>
				{th ? 'แชตปรับมุมมองต่อ' : 'Refine this view in chat'}
			</button>{/if}
	</div>
</section>

{#if open}
	<InterviewSheet
		title={th ? 'ปรับร้านให้เหมาะกับคุณ' : 'Make the shop fit you'}
		onclose={() => (open = false)}
	>
		<InterviewWizard
			view={{ plan, themeLocked, interview: answers ? { answers } : null }}
			initialDirectOnly={directOnly}
			onapply={(next: Answers, direct: boolean) => {
				open = false;
				onapply(next, direct);
			}}
		/>
	</InterviewSheet>
{/if}

<style>
	.interview-entry {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 0.85rem;
		margin-block: 0.7rem;
		border-block: 1px solid var(--seam);
		background: var(--surface);
	}
	p {
		margin: 0.3rem 0 0;
		color: var(--muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	button {
		font: inherit;
		min-height: var(--tap, 44px);
		padding: 0.5rem 0.75rem;
		color: white;
		background: var(--accent);
		border: 1px solid var(--accent);
		border-radius: var(--radius);
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.chat {
		color: var(--ink);
		background: var(--surface);
		border-color: var(--seam);
	}
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.compact {
		margin: 0;
		padding: 0.6rem 0.75rem;
		gap: 0.65rem;
		flex-wrap: nowrap;
	}
	.compact > div:first-child {
		flex: 1;
	}
	.compact .actions {
		width: auto;
		flex: 0 1 auto;
	}
	.compact .actions button {
		font-size: 0.875rem;
	}
	@media (max-width: 520px) {
		.actions {
			width: 100%;
		}
		.actions button {
			flex: 1 1 auto;
		}
	}
</style>
