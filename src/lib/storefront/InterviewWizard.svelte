<script lang="ts">
	import type { ShopperPlan } from '../personalization/plan';
	type InterviewView = {
		plan: ShopperPlan;
		lockedFields: (keyof ShopperPlan)[];
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
	const result = $derived(
		interviewProposal(answers, view.plan, { directOnly, lockedFields: view.lockedFields })
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
	class="m-0"
	onsubmit={(event) => {
		event.preventDefault();
		if (reviewing) onapply(answers, directOnly);
		else if (question && answers[question.id as Question]) void move(step + 1);
	}}
>
	<div class="step-content grid gap-4 p-4.5">
		<ol
			class="progress m-0 flex list-none gap-1.5 p-0 text-[length:var(--small)] leading-[1.4] text-[var(--muted)]"
			aria-label={t('Interview progress', 'ขั้นตอนการปรับมุมมอง')}
		>
			{#each stepNames as name, index (name[0])}
				<li
					class={[
						'group/interview-progress min-w-0 flex-1 pt-1.5 [border-top:2px_solid_var(--seam)] [&.complete]:border-[var(--muted)] [&.current]:border-[var(--accent)] [&.current]:font-[650] [&.current]:text-[var(--ink)] [@media(max-width:520px)]:group-data-[theme=large]/store:[&.current]:[flex:3]'
					]}
					class:current={step === index}
					class:complete={step > index}
					aria-current={step === index ? 'step' : undefined}
				>
					<span
						class="[@media(max-width:520px)]:group-data-[theme=large]/store:group-[:not(.current)]/interview-progress:absolute [@media(max-width:520px)]:group-data-[theme=large]/store:group-[:not(.current)]/interview-progress:h-px [@media(max-width:520px)]:group-data-[theme=large]/store:group-[:not(.current)]/interview-progress:w-px [@media(max-width:520px)]:group-data-[theme=large]/store:group-[:not(.current)]/interview-progress:overflow-hidden [@media(max-width:520px)]:group-data-[theme=large]/store:group-[:not(.current)]/interview-progress:[clip-path:inset(50%)]"
					>
						{name[lang === 'th' ? 1 : 0]}
					</span>
				</li>
			{/each}
		</ol>
		<h3
			class="mx-0 mt-1 mb-0 text-[1.4em] leading-[1.35] font-[650] text-balance"
			id="interview-step-title"
			bind:this={stepHeading}
			tabindex="-1"
		>
			{reviewing ? t('Review your view', 'ตรวจมุมมองที่เสนอ') : question[lang]}
		</h3>
		{#if question}
			<fieldset class="m-0 min-w-0 border-0 border-none p-0" aria-labelledby="interview-step-title">
				<div class="answers grid grid-cols-2 gap-2 group-data-[theme=large]/store:grid-cols-[1fr]">
					{#each question.options as option (option.id)}
						<label
							class={[
								'flex min-h-[max(var(--tap),3.25rem)] cursor-pointer items-center gap-[0.55rem] rounded-[var(--radius)] border border-[var(--seam)] bg-[var(--surface)] p-3 focus-within:border-[var(--ink)] hover:border-[var(--ink)] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[var(--accent)] [&.selected]:border-[var(--accent)] [&.selected]:font-semibold [&.selected]:outline-1 [&.selected]:outline-[var(--accent)]'
							]}
							class:selected={answers[question.id as Question] === option.id}
						>
							<input
								class="h-4.5 w-4.5 flex-none appearance-auto accent-[var(--accent)]"
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
			<button
				class="skip min-h-[var(--tap)] cursor-pointer [justify-self:start] rounded-[var(--radius)] border-0 border-none bg-transparent px-0 text-start font-normal text-[var(--ink)] underline underline-offset-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
				type="button"
				onclick={skip}
			>
				{interview.skip[lang]}
			</button>
		{:else}
			<section
				class="preview bg-[var(--surface)] px-3.5 py-[0.6rem] [border-block:1px_dashed_var(--muted)]"
				aria-label={t('Proposed view', 'มุมมองที่เสนอ')}
			>
				{#if changes.length}
					<dl class="m-0">
						{#each changes as item (item.field)}<div
								class="grid grid-cols-[minmax(5rem,1fr)_minmax(0,2fr)] gap-3 px-0 py-[0.4rem] [border-bottom:1px_dotted_var(--seam)]"
							>
								<dt class="text-[var(--muted)]">{item.label}</dt>
								<dd class="m-0 font-semibold">{item.text}</dd>
							</div>{/each}
					</dl>
				{:else}<p class="mx-0 my-[0.6rem] leading-[1.55] text-[var(--muted)]">
						{Object.keys(answers).length
							? t('Your current view already matches these answers.', 'มุมมองปัจจุบันตรงกับคำตอบนี้แล้ว')
							: t(
									'You skipped every question. Your view will stay the same.',
									'คุณข้ามทุกข้อ มุมมองจึงคงเดิม'
								)}
					</p>{/if}
				<p class="mx-0 my-[0.6rem] leading-[1.55] text-[var(--muted)]">
					{t(
						'Your product information stays the same. You can fine-tune this view in chat.',
						'ข้อมูลสินค้าคงเดิม แล้วค่อยแชตปรับมุมมองต่อได้'
					)}
				</p>
			</section>
			<details>
				<summary
					class="min-h-[var(--tap)] cursor-pointer py-[0.65rem] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
				>
					{t('How this view is chosen', 'มุมมองนี้เลือกมาอย่างไร')}
				</summary>
				<p class="mx-0 my-[0.6rem] leading-[1.55]">
					{t(
						'A model on this device suggests a view from example preferences. Your reading settings take priority.',
						'โมเดลในอุปกรณ์นี้เสนอรูปแบบจากตัวอย่างความชอบ โดยยึดการตั้งค่าการอ่านของคุณเป็นหลัก'
					)}
				</p>
				<label class="direct flex min-h-[var(--tap)] cursor-pointer items-center gap-[0.6rem]">
					<input
						class="h-4.5 w-4.5 flex-none appearance-auto accent-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
						type="checkbox"
						bind:checked={directOnly}
					/>
					<span>{t('Use direct answers only', 'ใช้เฉพาะคำตอบที่เลือก')}</span>
				</label>
				<p class="mx-0 my-[0.6rem] leading-[1.55]" data-testid="interview-backend">
					{result.backend === 'cnn'
						? t('The CNN evaluated your answers on this device.', 'CNN ประเมินคำตอบในอุปกรณ์นี้')
						: result.backend === 'incomplete'
							? t('Direct answers until the interview is complete.', 'ใช้คำตอบโดยตรงจนกว่าจะตอบครบ')
							: result.backend === 'unavailable'
								? t(
										'CNN unavailable. Direct answers still work.',
										'CNN ใช้งานไม่ได้ ยังใช้คำตอบโดยตรงได้'
									)
								: t('Using only the answers you chose.', 'ใช้คำตอบโดยตรง โดยไม่ผ่าน CNN')}
				</p>
				{#if result.prediction && result.backend === 'cnn'}
					<p class="mx-0 my-[0.6rem] leading-[1.55]">
						{t('CNN theme suggestion', 'ธีมที่ CNN เสนอ')}: {preferenceName(
							result.prediction.labels.theme,
							lang
						)}.
						{view.lockedFields.includes('theme')
							? t('Your existing theme is protected.', 'รักษาธีมที่คุณเลือกไว้แล้ว')
							: t('You can change or remove it after applying.', 'เปลี่ยนหรือลบได้หลังปรับมุมมอง')}
					</p>
					<dl class="m-0">
						{#each describePatch(result.patch, lang).filter((item) => result.sources[item.field] === 'cnn') as item (item.field)}
							<dt class="text-[var(--muted)]">{item.label} · CNN</dt>
							<dd class="m-0 font-semibold">{item.text}</dd>
						{/each}
					</dl>
				{/if}
			</details>
		{/if}
	</div>
	<div
		class="apply sticky bottom-0 flex items-center justify-end gap-3 bg-[var(--paper)] p-[0.65rem_1.125rem_max(0.65rem,env(safe-area-inset-bottom))] [border-top:1px_solid_var(--seam)]"
	>
		{#if step > 0}
			<button
				class="back me-auto min-h-[var(--tap)] cursor-pointer rounded-[var(--radius)] border border-[var(--seam)] bg-[var(--surface)] px-4 font-semibold text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
				type="button"
				onclick={() => move(step - 1)}
			>
				{t('Back', 'ย้อนกลับ')}
			</button>
		{/if}
		<button
			class="primary min-h-[var(--tap)] min-w-32 cursor-pointer rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-4 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45 [@media(max-width:520px)]:flex-1"
			disabled={!reviewing && !answers[question.id as Question]}
		>
			{reviewing
				? t('Apply my view', 'ใช้มุมมองนี้')
				: step === interview.questions.length - 1
					? t('Preview my view', 'ดูมุมมองที่เสนอ')
					: t('Next', 'ถัดไป')}
		</button>
	</div>
</form>
