<script lang="ts">
	import type { ShopperPlan } from '../personalization/plan';
	import InterviewConversation from './InterviewConversation.svelte';
	type InterviewView = {
		plan: ShopperPlan;
		interview: { answers: Answers } | null;
	};
	import { tick, untrack } from 'svelte';
	import {
		interview,
		interviewProposal,
		describePatch,
		type Answers,
		type Question
	} from '../personalization/interview';
	let {
		view,
		onapply
	}: {
		view: InterviewView;
		onapply: (answers: Answers) => void;
	} = $props();
	// Draft lives only inside the sheet. Closing it never changes the shop.
	let answers = $state<Answers>(untrack(() => ({ ...view.interview?.answers })));
	let conversationOpen = $state(false);
	let conversationTrigger = $state<HTMLButtonElement>();
	let step = $state(0);
	let stepHeading = $state<HTMLHeadingElement>();
	const question = $derived(interview.questions[step]);
	const reviewing = $derived(step === interview.questions.length);
	const lang = $derived(view.plan.locale);
	const t = (en: string, th: string) => (lang === 'th' ? th : en);
	const stepNames = [
		['Goal', 'เป้าหมาย'],
		['Details', 'ข้อมูล'],
		['Priority', 'สิ่งสำคัญ'],
		['Reading', 'การอ่าน'],
		['Review', 'ทบทวน']
	];
	async function move(next: number) {
		step = Math.max(0, Math.min(interview.questions.length, next));
		await tick();
		stepHeading?.focus();
	}
	function skip() {
		if (!question) return;
		const next = { ...answers };
		delete next[question.id as Question];
		answers = next;
		void move(step + 1);
	}
	const result = $derived(interviewProposal(answers, view.plan));
	const changes = $derived(
		describePatch(
			Object.fromEntries(
				Object.entries(result.patch).filter(
					([key, value]) =>
						JSON.stringify(view.plan[key as keyof ShopperPlan]) !== JSON.stringify(value)
				)
			),
			lang
		)
	);
</script>

{#if conversationOpen}
	<InterviewConversation
		locale={lang}
		oncancel={async () => {
			conversationOpen = false;
			await tick();
			conversationTrigger?.focus();
		}}
		oncomplete={(draft: Answers) => {
			answers = draft;
			conversationOpen = false;
			void move(interview.questions.length);
		}}
	/>
{:else}
	{#if step === 0}
		<div class="assistant-option">
			<p>
				{t(
					'Prefer a conversation? Answer one question at a time in the guided chat.',
					'หากชอบคุยมากกว่าเลือกในแบบฟอร์ม ลองตอบคำถามทีละข้อในแชตได้'
				)}
			</p>
			<button
				type="button"
				bind:this={conversationTrigger}
				onclick={() => (conversationOpen = true)}
			>
				{t('Talk to the assistant', 'คุยกับผู้ช่วย')}
			</button>
		</div>
	{/if}
	<form
		onsubmit={(event) => {
			event.preventDefault();
			if (reviewing) onapply(answers);
			else if (question && answers[question.id as Question]) void move(step + 1);
		}}
	>
		<div class="step-content">
			<ol class="progress" aria-label={t('Interview progress', 'ขั้นตอนการปรับมุมมอง')}>
				{#each stepNames as name, index (name[0])}
					<li
						class:current={step === index}
						class:complete={step > index}
						aria-current={step === index ? 'step' : undefined}
					>
						<span>{name[lang === 'th' ? 1 : 0]}</span>
					</li>
				{/each}
			</ol>
			<h3 id="interview-step-title" bind:this={stepHeading} tabindex="-1">
				{reviewing ? t('Review your view', 'ตรวจมุมมองที่เสนอ') : question[lang]}
			</h3>
			{#if question}
				<fieldset aria-labelledby="interview-step-title">
					<div class="answers">
						{#each question.options as option (option.id)}
							<label class:selected={answers[question.id as Question] === option.id}>
								<input
									type="radio"
									name={question.id}
									value={option.id}
									checked={answers[question.id as Question] === option.id}
									onchange={() => (answers = { ...answers, [question.id]: option.id })}
								/>
								<span>{option[lang]}</span>
							</label>
						{/each}
					</div>
				</fieldset>
				<button class="skip" type="button" onclick={skip}>{interview.skip[lang]}</button>
			{:else}
				<section class="preview" aria-label={t('Proposed view', 'มุมมองที่เสนอ')}>
					{#if changes.length}
						<dl>
							{#each changes as item (item.field)}<div>
									<dt>{item.label}</dt>
									<dd>{item.text}</dd>
								</div>{/each}
						</dl>
					{:else}<p>
							{Object.keys(answers).length
								? t('Your current view already matches these answers.', 'มุมมองปัจจุบันตรงกับคำตอบนี้แล้ว')
								: t(
										'You skipped every question. Your view will stay the same.',
										'คุณข้ามทุกข้อ มุมมองจึงคงเดิม'
									)}
						</p>{/if}
					<p>
						{t(
							'Your product information stays the same. You can fine-tune this view in chat.',
							'ข้อมูลสินค้าคงเดิม แล้วค่อยแชตปรับมุมมองต่อได้'
						)}
					</p>
				</section>
			{/if}
		</div>
		<div class="apply">
			{#if step > 0}
				<button class="back" type="button" onclick={() => move(step - 1)}>
					{t('Back', 'ย้อนกลับ')}
				</button>
			{/if}
			<button class="primary" disabled={!reviewing && !answers[question.id as Question]}>
				{reviewing
					? t('Apply my view', 'ใช้มุมมองนี้')
					: step === interview.questions.length - 1
						? t('Preview my view', 'ดูมุมมองที่เสนอ')
						: t('Next', 'ถัดไป')}
			</button>
		</div>
	</form>
{/if}

<style>
	form {
		margin: 0;
	}
	.assistant-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		padding: 0.875rem 1.125rem 0;
	}
	.assistant-option p {
		margin: 0;
		color: var(--muted);
	}
	.assistant-option button {
		min-height: var(--tap);
		padding-inline: 0.8rem;
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.step-content {
		display: grid;
		gap: 1rem;
		padding: 1.125rem;
	}
	.progress {
		display: flex;
		gap: 0.375rem;
		list-style: none;
		margin: 0;
		padding: 0;
		color: var(--muted);
		font-size: var(--small);
		line-height: 1.4;
	}
	.progress li {
		flex: 1;
		min-width: 0;
		padding-top: 0.375rem;
		border-top: 2px solid var(--seam);
	}
	.progress .complete {
		border-color: var(--muted);
	}
	.progress .current {
		color: var(--ink);
		border-color: var(--accent);
		font-weight: 650;
	}
	h3 {
		font-size: 1.4em;
		line-height: 1.35;
		font-weight: 650;
		margin: 0.25rem 0 0;
		text-wrap: balance;
	}
	fieldset {
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}
	.answers {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem;
	}
	.answers label {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.75rem;
		min-height: max(var(--tap), 3.25rem);
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		background: var(--surface);
		cursor: pointer;
	}
	.answers label:hover,
	.answers label:focus-within {
		border-color: var(--ink);
	}
	.answers label:has(input:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.answers label.selected {
		border-color: var(--accent);
		outline: 1px solid var(--accent);
		font-weight: 600;
	}
	input {
		appearance: auto;
		accent-color: var(--accent);
		width: 1.125rem;
		height: 1.125rem;
		flex: none;
	}
	button {
		font: inherit;
		font-weight: 600;
		min-height: var(--tap);
		padding-inline: 1rem;
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		color: var(--ink);
		background: var(--surface);
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.primary {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}
	.skip {
		justify-self: start;
		padding-inline: 0;
		text-align: start;
		text-decoration: underline;
		text-underline-offset: 0.2em;
		border: 0;
		background: transparent;
		font-weight: 400;
	}
	.preview {
		background: var(--surface);
		border-block: 1px dashed var(--muted);
		padding: 0.6rem 0.875rem;
	}
	dl {
		margin: 0;
	}
	dl div {
		padding: 0.4rem 0;
		border-bottom: 1px dotted var(--seam);
	}
	.preview dl div {
		display: grid;
		grid-template-columns: minmax(5rem, 1fr) minmax(0, 2fr);
		gap: 0.75rem;
	}
	dt {
		color: var(--muted);
	}
	dd {
		margin: 0;
		font-weight: 600;
	}
	p {
		margin: 0.6rem 0;
		line-height: 1.55;
	}
	.preview p {
		color: var(--muted);
	}
	.apply {
		position: sticky;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 0.65rem 1.125rem max(0.65rem, env(safe-area-inset-bottom));
		background: var(--paper);
		border-top: 1px solid var(--seam);
	}
	.apply .primary {
		min-width: 8rem;
	}
	.apply .back {
		margin-inline-end: auto;
	}
	:global([data-theme='large']) .answers {
		grid-template-columns: 1fr;
	}
	@media (max-width: 520px) {
		.apply .primary {
			flex: 1;
		}
		:global([data-theme='large']) .progress li:not(.current) span {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
		}
		:global([data-theme='large']) .progress .current {
			flex: 3;
		}
	}
</style>
