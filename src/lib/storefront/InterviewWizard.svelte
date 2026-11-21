<script lang="ts">
	import type { ShopperPlan } from '../personalization/plan';
	type InterviewView = {
		plan: ShopperPlan;
		themeLocked: boolean;
		interview: { answers: Answers } | null;
	};
	import { tick, untrack } from 'svelte';
	import {
		interview,
		interviewProposal,
		describePatch,
		preferenceName,
		type Answers,
		type Question
	} from '../personalization/interview';
	let {
		view,
		onapply,
		initialDirectOnly = false
	}: {
		view: InterviewView;
		initialDirectOnly?: boolean;
		onapply: (answers: Answers, directOnly: boolean) => void;
	} = $props();
	// Draft lives only inside the sheet. Closing it never changes the shop.
	let answers = $state<Answers>(untrack(() => ({ ...view.interview?.answers })));
	let directOnly = $state(untrack(() => initialDirectOnly));
	let step = $state(0);
	let stepHeading = $state<HTMLHeadingElement>();
	const question = $derived(interview.questions[step]);
	const reviewing = $derived(step === interview.questions.length);
	const lang = $derived(view.plan.locale);
	const t = (en: string, th: string) => (lang === 'th' ? th : en);
	const stepNames = [
		['Shopping', 'การเลือกซื้อ'],
		['Information', 'ข้อมูล'],
		['Priorities', 'สิ่งสำคัญ'],
		['Reading', 'การอ่าน']
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
	const result = $derived(
		interviewProposal(answers, view.plan, { directOnly, themeLocked: view.themeLocked })
	);
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

<form
	onsubmit={(event) => {
		event.preventDefault();
		if (reviewing) onapply(answers, directOnly);
		else if (question && answers[question.id as Question]) void move(step + 1);
	}}
>
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
		<p class="intro">
			{t('Choose what feels right. You can skip any question.', 'เลือกแบบที่ชอบ ข้ามข้อที่ยังไม่แน่ใจได้')}
		</p>
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
					{t('Your current view already matches these answers.', 'มุมมองปัจจุบันตรงกับคำตอบนี้แล้ว')}
				</p>{/if}
			<p>
				{t(
					'Your product information stays the same. You can fine-tune this view in chat.',
					'ข้อมูลสินค้าคงเดิม แล้วค่อยแชตปรับมุมมองต่อได้'
				)}
			</p>
		</section>
		<details>
			<summary>{t('How this view is chosen', 'มุมมองนี้เลือกมาอย่างไร')}</summary>
			<p>
				{t(
					'The CNN runs on this device. It learned from example preferences, not real shopper outcomes. It chooses layout, sections, information and theme; your reading controls stay protected.',
					'CNN ทำงานบนอุปกรณ์นี้ เรียนรู้จากตัวอย่างความชอบ ไม่ใช่ผลการใช้งานของผู้ซื้อจริง เลือกรูปแบบ ส่วนต่าง ๆ ข้อมูล และธีม โดยรักษาการตั้งค่าการอ่านของคุณ'
				)}
			</p>
			<label class="direct">
				<input type="checkbox" bind:checked={directOnly} />
				<span>{t('Use direct answers only', 'ใช้เฉพาะคำตอบที่เลือก')}</span>
			</label>
			<p data-testid="interview-backend">
				{result.backend === 'cnn'
					? t(
							'CNN evaluated locally; reading settings protected.',
							'ประเมินด้วย CNN ในเครื่อง โดยรักษาการตั้งค่าการอ่าน'
						)
					: result.backend === 'incomplete'
						? t('Direct answers until the interview is complete.', 'ใช้คำตอบโดยตรงจนกว่าจะตอบครบ')
						: result.backend === 'unavailable'
							? t('CNN unavailable. Direct answers still work.', 'CNN ใช้งานไม่ได้ ยังใช้คำตอบโดยตรงได้')
							: t('Direct answers; CNN bypassed.', 'ใช้คำตอบโดยตรง โดยไม่ผ่าน CNN')}
			</p>
			{#if result.prediction && result.backend === 'cnn'}
				<p>
					{t('CNN theme suggestion', 'ธีมที่ CNN เสนอ')}: {preferenceName(
						result.prediction.labels.theme,
						lang
					)}.
					{view.themeLocked
						? t('Your existing theme is protected.', 'รักษาธีมที่คุณเลือกไว้แล้ว')
						: t('You can change or remove it after applying.', 'เปลี่ยนหรือลบได้หลังปรับมุมมอง')}
				</p>
				<dl>
					{#each describePatch(result.patch, lang).filter((item) => result.sources[item.field] === 'cnn') as item (item.field)}
						<dt>{item.label} · CNN</dt>
						<dd>{item.text}</dd>
					{/each}
				</dl>
			{/if}
		</details>
	{/if}
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

<style>
	:is(button, input, summary):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	button {
		font: inherit;
		min-height: var(--tap, 44px);
		padding: 10px 16px;
		border: 1px solid var(--seam);
		color: var(--ink);
		background: var(--surface);
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.primary {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}
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
		border-top: 3px solid var(--seam);
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
	.preview {
		padding: 16px;
		border-block: 1px dashed var(--muted);
		background: var(--surface);
	}
	h3 {
		font-size: 1em;
		margin: 0 0 12px;
	}
	p {
		font-size: 1em;
	}
	dl {
		margin: 0;
	}
	dl div {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
		padding: 8px 0;
		border-bottom: 1px dotted var(--seam);
	}
	dt {
		color: var(--muted);
	}
	dd {
		margin: 0;
		font-weight: 600;
	}
	summary {
		cursor: pointer;
		min-height: 48px;
		padding: 12px 0;
	}
	.direct {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 48px;
	}
	.apply {
		position: sticky;
		bottom: -28px;
		display: flex;
		gap: 12px;
		background: var(--paper);
		padding: 12px 0;
		border-top: 1px solid var(--seam);
	}
	.apply button {
		min-height: 48px;
		justify-content: center !important;
	}
	.apply .primary {
		flex: 1;
	}
	.apply .back {
		background: var(--surface);
		border: 1px solid var(--seam);
		padding: 12px 20px;
		color: var(--ink);
	}
	:global([data-theme='large']) form {
		font-size: 20px;
	}
	:global([data-theme='large']) .progress {
		font-size: 20px;
	}
	:global([data-theme='large']) .answers {
		grid-template-columns: 1fr;
	}
</style>
