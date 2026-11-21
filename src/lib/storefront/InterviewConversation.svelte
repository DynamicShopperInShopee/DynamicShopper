<script lang="ts">
	import { onMount } from 'svelte';
	import type { Answers } from '../personalization/interview';
	import {
		continueOfflineInterview,
		startOfflineInterview,
		type OfflineInterviewState
	} from '../personalization/interview-offline';

	let {
		locale,
		oncomplete,
		oncancel
	}: {
		locale: 'en' | 'th';
		oncomplete: (answers: Answers) => void;
		oncancel: () => void;
	} = $props();
	type Message = { role: 'assistant' | 'user'; content: string };
	let messages = $state<Message[]>([]);
	let text = $state('');
	let busy = $state(false);
	let offline = $state<OfflineInterviewState | null>(null);
	let transcript = $state<HTMLDivElement>();
	let heading = $state<HTMLHeadingElement>();
	const t = (en: string, th: string) => (locale === 'th' ? th : en);
	onMount(() => heading?.focus({ preventScroll: true }));
	const fromModelAnswers = (raw: Record<string, string | null>): Answers => ({
		...(raw.goal
			? {
					goal: (
						{
							compare: 'compare',
							discover: 'browse',
							quick: 'shortlist',
							someone: 'gift'
						} as Record<string, string>
					)[raw.goal]
				}
			: {}),
		...(raw.matters
			? {
					priority: (
						{
							price: 'value',
							quality: 'durability',
							design: 'value',
							performance: 'performance',
							ease: 'rating',
							delivery: 'value'
						} as Record<string, string>
					)[raw.matters]
				}
			: {}),
		...(raw.detail
			? {
					evidence: (
						{ simple: 'summary', balanced: 'specs', detailed: 'specs' } as Record<string, string>
					)[raw.detail]
				}
			: {}),
		...(raw.help && raw.help !== 'none'
			? {
					goal: (
						{
							'best-total': 'shortlist',
							comparison: 'compare',
							'complete-set': 'gift',
							refills: 'gift',
							none: 'browse'
						} as Record<string, string>
					)[raw.help]
				}
			: {}),
		...(raw.access === 'larger-text'
			? { reading: 'large' }
			: raw.access === 'standard'
				? { reading: 'comfortable' }
				: {})
	});

	async function send(message: string) {
		if (busy || !message.trim()) return;
		busy = true;
		text = '';
		const input = message.trim();
		try {
			if (offline) {
				const next = continueOfflineInterview(offline, input, locale);
				offline = next;
				messages = [
					...messages,
					{ role: 'user' as const, content: input },
					{ role: 'assistant' as const, content: next.reply }
				].slice(-12);
				if (next.complete) oncomplete(next.answers);
				await Promise.resolve();
				transcript?.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
				return;
			}
			const response = await fetch('/api/interview', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ locale, history: messages.slice(-12), message: input })
			});
			if (!response.ok) throw new Error('Interview unavailable');
			const data = (await response.json()) as {
				reply: string;
				complete: boolean;
				answers: Record<string, string | null>;
			};
			const nextMessages = [
				...messages,
				{ role: 'user' as const, content: input },
				{ role: 'assistant' as const, content: data.reply }
			];
			messages = nextMessages.slice(-12);
			if (data.complete) oncomplete(fromModelAnswers(data.answers));
			await Promise.resolve();
			transcript?.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
		} catch {
			// Offline is a first-class path: when the service cannot answer, the
			// same four authored questions continue in the conversation.
			const next = startOfflineInterview(locale);
			offline = next;
			messages = [
				...messages,
				{ role: 'user' as const, content: input },
				{ role: 'assistant' as const, content: next.reply }
			].slice(-12);
			await Promise.resolve();
			transcript?.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
		} finally {
			busy = false;
		}
	}

	function start() {
		void send(
			t(
				'Help me personalize my shop. Ask me one question at a time.',
				'ช่วยปรับหน้าร้านให้เหมาะกับฉัน ถามทีละข้อได้เลย'
			)
		);
	}
</script>

<section class="conversation-mode" aria-label={t('AI interview', 'สัมภาษณ์ด้วย AI')}>
	<div class="step-content">
		<h3 id="interview-step-title" bind:this={heading} tabindex="-1">
			{t('Let’s shape your shop', 'มาปรับหน้าร้านให้เหมาะกับคุณ')}
		</h3>
		<p class="intro">
			{t(
				'The assistant asks about your presentation preferences. Product facts stay unchanged.',
				'ผู้ช่วยจะถามถึงรูปแบบการแสดงผลที่คุณชอบ โดยข้อมูลสินค้าคงเดิม'
			)}
		</p>
		<div class="conversation" bind:this={transcript} aria-live="polite">
			{#if !messages.length}
				<p class="empty">{t('Start the interview to begin.', 'เริ่มสัมภาษณ์เพื่อพูดคุย')}</p>
			{/if}
			{#each messages as message, index (`${message.role}-${index}`)}
				<p class:shopper={message.role === 'user'} class:assistant={message.role === 'assistant'}>
					{message.content}
				</p>
			{/each}
			{#if busy}<p class="status">{t('Thinking…', 'กำลังคิด…')}</p>{/if}
		</div>
		{#if offline}
			<p class="status" role="status">
				{t(
					'Live interview unavailable — continuing with the offline choices.',
					'บริการสัมภาษณ์สดใช้งานไม่ได้ กำลังใช้ตัวเลือกออฟไลน์แทน'
				)}
			</p>
		{/if}
		{#if !messages.length}
			<button type="button" class="primary" onclick={start} disabled={busy}>
				{t('Start interview', 'เริ่มสัมภาษณ์')}
			</button>
		{:else}
			<form
				class="composer"
				onsubmit={(event) => {
					event.preventDefault();
					void send(text);
				}}
			>
				<label class="sr-only" for="interview-reply">{t('Your answer', 'คำตอบของคุณ')}</label>
				<textarea
					id="interview-reply"
					bind:value={text}
					maxlength="500"
					rows="2"
					disabled={busy}
					placeholder={t('Type your answer…', 'พิมพ์คำตอบ…')}></textarea>
				<button class="primary" disabled={busy || !text.trim()}>{t('Reply', 'ตอบ')}</button>
			</form>
		{/if}
	</div>
	<div class="apply">
		<button type="button" class="back" onclick={oncancel}>
			{t('Use offline choices', 'ใช้ตัวเลือกออฟไลน์')}
		</button>
	</div>
</section>

<style>
	.conversation-mode {
		display: grid;
		gap: 0.5rem;
	}
	.step-content {
		display: grid;
		gap: 1rem;
		padding: 1.125rem;
	}
	h3 {
		margin: 0;
		font-size: 1.4em;
		line-height: 1.35;
	}
	.intro,
	.empty,
	.status {
		margin: 0;
		color: var(--muted);
	}
	.conversation {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 32vh;
		overflow: auto;
		padding: 0.75rem 0;
		border-block: 1px solid var(--seam);
	}
	.conversation p {
		max-width: 90%;
		margin: 0;
		padding: 0.65rem 0.8rem;
		line-height: 1.5;
	}
	.assistant {
		align-self: start;
		border: 1px solid var(--seam);
		background: var(--surface);
	}
	.shopper {
		align-self: end;
		border: 1px solid var(--accent);
		background: var(--surface);
	}
	.composer {
		display: flex;
		align-items: end;
		gap: 0.5rem;
	}
	textarea {
		flex: 1;
		min-width: 0;
		resize: vertical;
		padding: 0.7rem;
		border: 1px solid var(--seam);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}
	button {
		min-height: var(--tap);
		padding-inline: 1rem;
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	button.primary {
		border-color: var(--accent);
		background: var(--accent);
		color: white;
	}
	.apply {
		position: sticky;
		bottom: 0;
		display: flex;
		justify-content: flex-end;
		padding: 0.65rem 1.125rem max(0.65rem, env(safe-area-inset-bottom));
		border-top: 1px solid var(--seam);
		background: var(--paper);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
