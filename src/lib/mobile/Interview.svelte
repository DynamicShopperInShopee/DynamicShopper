<script lang="ts">
	import type { View } from './engine';
	import { tick, untrack } from 'svelte';
	import { interview, type Answers, type Question } from '../personalization/interview';
	let { view, oncomplete }: { view: View; oncomplete: (answers: Answers) => void } = $props();
	// Draft answers stay inside the sheet; only completing the last step changes the shop.
	let answers = $state<Answers>(untrack(() => ({ ...view.interview?.answers })));
	let step = $state(0);
	let completed = false;
	let stepHeading = $state<HTMLHeadingElement>();
	const question = $derived(interview.questions[step]);
	const last = $derived(step === interview.questions.length - 1);
	const lang = $derived(view.plan.locale);
	const t = (en: string, th: string) => (lang === 'th' ? th : en);
	const stepNames = [
		['Shopping', 'การเลือกซื้อ'],
		['Information', 'ข้อมูล'],
		['Priorities', 'สิ่งสำคัญ'],
		['Reading', 'การอ่าน']
	];
	async function move(next: number) {
		step = Math.max(0, Math.min(interview.questions.length - 1, next));
		await tick();
		stepHeading?.focus();
	}
	function advance(nextAnswers: Answers = answers) {
		if (completed) return;
		if (last) {
			completed = true;
			oncomplete({ ...nextAnswers });
		} else void move(step + 1);
	}
	function skip() {
		const next = { ...answers };
		delete next[question.id as Question];
		answers = next;
		advance(next);
	}
</script>

<form
	onsubmit={(event) => {
		event.preventDefault();
		if (answers[question.id as Question]) advance();
	}}
>
	<ol class="progress" aria-label={t('Interview progress', 'ขั้นตอนการปรับมุมมอง')}>
		{#each stepNames as name, index (index)}<li
				class:current={step === index}
				class:complete={step > index}
				aria-current={step === index ? 'step' : undefined}
			>
				<span>{name[lang === 'th' ? 1 : 0]}</span>
			</li>{/each}
	</ol>
	<h3 id="interview-step-title" bind:this={stepHeading} tabindex="-1">{question[lang]}</h3>
	<p class="intro">
		{t(
			'Tell us what matters to you. Finishing the interview adapts your shop automatically; you can undo it or refine it in chat.',
			'บอกสิ่งที่สำคัญกับคุณ เมื่อตอบเสร็จ หน้าร้านจะปรับให้โดยอัตโนมัติ ย้อนกลับหรือแชตปรับต่อได้'
		)}
	</p>
	<fieldset aria-labelledby="interview-step-title">
		<div class="answers">
			{#each question.options as option (option.id)}<label
					class:selected={answers[question.id as Question] === option.id}
				>
					<input
						type="radio"
						name={question.id}
						value={option.id}
						checked={answers[question.id as Question] === option.id}
						onchange={() => (answers = { ...answers, [question.id]: option.id })}
					/>
					<span>{option[lang]}</span>
				</label>{/each}
		</div>
	</fieldset>
	<button class="skip" type="button" onclick={skip}>{interview.skip[lang]}</button>
	<div class="actions">
		{#if step > 0}<button class="back" type="button" onclick={() => move(step - 1)}>
				{t('Back', 'ย้อนกลับ')}
			</button>{/if}
		<button class="primary" disabled={!answers[question.id as Question]}>
			{last ? t('Finish interview', 'ตอบเสร็จแล้ว') : t('Next', 'ถัดไป')}
		</button>
	</div>
</form>

<style>
	form {
		display: grid;
		min-width: 0;
		margin: 0 !important;
		gap: 16px !important;
	}
	.progress {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		list-style: none;
		margin: 0 0 8px;
		padding: 0;
		color: var(--muted);
		font-size: 13px;
	}
	.progress li {
		padding-top: 10px;
		border-top: 3px solid var(--line);
		overflow-wrap: anywhere;
	}
	.progress .current,
	.progress .complete {
		border-color: var(--accent);
	}
	.progress .current {
		color: var(--ink);
		font-weight: 600;
	}
	#interview-step-title {
		font-size: 1.25em;
		line-height: 1.5;
		margin: 0;
		scroll-margin-top: 100px;
	}
	.intro {
		margin: 0;
		color: var(--muted);
	}
	fieldset {
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}
	.answers {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.answers label {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 16px 12px;
		min-height: 60px;
		border: 1px solid var(--muted);
		border-radius: 4px;
		cursor: pointer;
		background: var(--surface);
	}
	.answers .selected {
		border-color: var(--accent);
		background: var(--paper);
		outline: 1px solid var(--accent);
	}
	input {
		accent-color: var(--accent);
		flex-shrink: 0;
		width: 18px;
		height: 18px;
	}
	.skip {
		min-height: 48px;
		margin: 0;
		text-align: left;
		text-decoration: underline;
		border: 0 !important;
		background: transparent !important;
		padding-left: 0 !important;
	}
	.actions {
		position: sticky;
		bottom: -28px;
		display: flex;
		gap: 12px;
		background: var(--paper);
		padding: 12px 0;
		border-top: 1px solid var(--line);
	}
	.actions button {
		min-height: 48px;
		justify-content: center !important;
	}
	.actions .primary {
		flex: 1;
	}
	.actions .back {
		background: var(--surface);
		border: 1px solid var(--line);
		padding: 12px 20px;
		color: var(--ink);
	}
	:global(.large) form {
		font-size: 20px;
	}
	:global(.large) .progress {
		font-size: 20px;
	}
	:global(.large) .answers {
		grid-template-columns: 1fr;
	}
</style>
