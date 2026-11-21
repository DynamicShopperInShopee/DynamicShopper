<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { interview, type Answers } from '../personalization/interview';

	let {
		locale,
		oncomplete,
		oncancel
	}: {
		locale: 'en' | 'th';
		oncomplete: (answers: Answers) => void;
		oncancel: () => void;
	} = $props();
	const { questions } = interview;
	let replies = $state<(string | null)[]>([]);
	let text = $state('');
	let unrecognized = $state(false);
	let heading = $state<HTMLHeadingElement>();
	const current = $derived(questions[replies.length]);
	const t = (en: string, th: string) => (locale === 'th' ? th : en);
	onMount(() => heading?.focus({ preventScroll: true }));

	async function answer(option: string | null) {
		if (!current) return;
		replies = [...replies, option];
		text = '';
		unrecognized = false;
		if (replies.length === questions.length) {
			const draft = Object.fromEntries(
				replies.flatMap((id, i) => (id ? [[questions[i].id, id]] : []))
			);
			oncomplete(draft);
			return;
		}
		await tick();
		heading?.focus({ preventScroll: true });
	}

	function send() {
		const entry = text.trim().toLowerCase();
		const choice = current?.options.find((item) =>
			[item.en.toLowerCase(), item.th, item.id].includes(entry)
		);
		if (choice) void answer(choice.id);
		else unrecognized = true;
	}
</script>

<section class="grid gap-3 p-4" aria-label={t('Guided interview', 'แชตปรับมุมมอง')}>
	{#if replies.length}
		<dl class="m-0 max-h-[20vh] overflow-auto border-b border-[var(--seam)] pb-2">
			{#each replies as id, index (index)}
				{@const question = questions[index]}
				<dt>{question[locale]}</dt>
				<dd class="m-0 mb-2 font-semibold">
					{question.options.find((option) => option.id === id)?.[locale] ?? t('Skipped', 'ข้ามแล้ว')}
				</dd>
			{/each}
		</dl>
	{/if}
	{#if current}
		<h3
			id="interview-step-title"
			class="m-0 text-[1.25em] font-semibold"
			bind:this={heading}
			tabindex="-1"
		>
			{current[locale]}
		</h3>
		<p class="m-0 text-[var(--muted)]">
			{t('Choose a reply or type one below.', 'เลือกคำตอบหรือพิมพ์คำตอบที่แสดงด้านล่าง')}
		</p>
		<div class="flex flex-wrap gap-2" role="group" aria-labelledby="interview-step-title">
			{#each current.options as option (option.id)}
				<button type="button" onclick={() => answer(option.id)}>{option[locale]}</button>
			{/each}
		</div>
		<form
			class="flex items-end gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				send();
			}}
		>
			<label class="min-w-0 flex-1">
				{t('Your answer', 'คำตอบของคุณ')}
				<input
					class="block min-h-[var(--tap,44px)] w-full border border-[var(--seam)] px-2"
					bind:value={text}
					maxlength="500"
				/>
			</label>
			<button class="primary" disabled={!text.trim()}>{t('Reply', 'ตอบ')}</button>
		</form>
		{#if unrecognized}<p class="m-0" role="status">
				{t(
					'Choose one of the listed replies, or skip this question.',
					'เลือกหนึ่งในคำตอบที่แสดง หรือข้ามข้อนี้ได้'
				)}
			</p>{/if}
		<div class="flex flex-wrap justify-between gap-2">
			<button type="button" onclick={oncancel}>{t('Back to choices', 'กลับไปเลือกคำตอบ')}</button>
			<button type="button" onclick={() => answer(null)}>
				{t('Skip this question', 'ข้ามคำถามนี้')}
			</button>
		</div>
	{/if}
</section>

<style>
	button {
		min-height: var(--tap, 44px);
		padding-inline: 0.8rem;
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		cursor: pointer;
	}
	.primary {
		border-color: var(--accent);
		background: var(--accent);
		color: white;
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
