<script lang="ts">
	import type { ShopperPlan } from '../personalization/plan';
	import type { Answers } from '../personalization/interview';
	import InterviewWizard from './InterviewWizard.svelte';
	import InterviewSheet from './InterviewSheet.svelte';
	import { tick } from 'svelte';
	let {
		plan,
		lockedFields,
		answers,
		directOnly,
		applied,
		disabled,
		compact = false,
		onapply,
		onchat,
		onundo
	}: {
		plan: ShopperPlan;
		lockedFields: (keyof ShopperPlan)[];
		answers: Answers | null;
		directOnly: boolean;
		applied: boolean;
		disabled: boolean;
		compact?: boolean;
		onapply: (answers: Answers, directOnly: boolean) => void;
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
	class={[
		'interview-entry group/interview-entry my-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 bg-[var(--surface)] px-4 py-3.5 [border-block:1px_solid_var(--seam)] [&.compact]:m-0 [&.compact]:grid [&.compact]:grid-cols-[minmax(0,1fr)_auto] [&.compact]:gap-3 [&.compact]:px-3 [&.compact]:py-2'
	]}
	class:compact
	aria-label={th ? 'เลือกวิธีดูสินค้า' : 'Make the store fit you'}
>
	<div class="copy min-w-0">
		<h2 class="m-0 text-[length:var(--size)] leading-[1.4] font-semibold">
			{applied
				? th
					? 'ปรับมุมมองตามคำตอบแล้ว'
					: 'Your preferences are applied'
				: th
					? 'เลือกรูปแบบและขนาดตัวอักษร'
					: 'Choose your layout and text size'}
		</h2>
		{#if !compact && !applied}
			<p class="mx-0 mt-[0.2rem] mb-0 text-[var(--muted)]">
				{th
					? 'เลือกข้อมูลที่อยากเห็นก่อน แล้วดูตัวอย่างก่อนใช้'
					: 'Choose which details come first and preview the result.'}
			</p>
		{/if}
	</div>
	<div
		class="actions flex flex-wrap gap-x-2.5 gap-y-[0.4rem] [@media(max-width:520px)]:group-[:not(.compact)]/interview-entry:w-full"
	>
		{#if applied}<button
				class="primary min-h-[var(--tap)] cursor-pointer rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-[0.8rem] font-semibold text-white group-[.compact]/interview-entry:text-[length:var(--small)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] hover:enabled:border-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
				type="button"
				onclick={onchat}
			>
				{th ? 'แชตปรับมุมมองต่อ' : 'Refine this view in chat'}
			</button>{/if}
		<button
			class={[
				'min-h-[var(--tap)] cursor-pointer rounded-[var(--radius)] border border-[var(--seam)] bg-[var(--surface)] px-[0.8rem] font-semibold text-[var(--ink)] group-[.compact]/interview-entry:text-[length:var(--small)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] hover:enabled:border-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45 [&.primary]:border-[var(--accent)] [&.primary]:bg-[var(--accent)] [&.primary]:text-white'
			]}
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
			<button
				class="min-h-[var(--tap)] cursor-pointer rounded-[var(--radius)] border border-[var(--seam)] bg-[var(--surface)] px-[0.8rem] font-semibold text-[var(--ink)] group-[.compact]/interview-entry:text-[length:var(--small)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] hover:enabled:border-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
				type="button"
				disabled={!onundo}
				onclick={undoFromShelf}
			>
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
			view={{ plan, lockedFields, interview: answers ? { answers } : null }}
			initialDirectOnly={directOnly}
			onapply={(next: Answers, direct: boolean) => {
				open = false;
				onapply(next, direct);
			}}
		/>
	</InterviewSheet>
{/if}
