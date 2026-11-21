<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';
	import type { FactLocale } from './verifyFacts';

	import type { ChatMessage } from './conversation.svelte';
	let {
		locale,
		messages,
		pending,
		onSend,
		renderReply,
		largePrint = false,
		showingDeal = false,
		inputLabel,
		pendingLabel
	}: {
		locale: FactLocale;
		messages: readonly ChatMessage[];
		pending: boolean;
		onSend: (message: string) => boolean | void;
		renderReply?: Snippet<[ChatMessage]>;
		largePrint?: boolean;
		showingDeal?: boolean;
		inputLabel?: string;
		pendingLabel?: string;
	} = $props();

	const copy = {
		en: {
			title: 'Chat with the assistant',
			close: 'Close chat',
			message: 'Message',
			send: 'Send',
			help: 'Tell me what you’re looking for or how you’d like the store to look.',
			pending: 'Reading your request…',
			offline: 'Offline mode',
			failed: 'Message could not be sent. You can try again.',
			history: 'Conversation'
		},
		th: {
			title: 'แชตกับผู้ช่วย',
			close: 'ปิดแชต',
			message: 'ข้อความ',
			send: 'ส่ง',
			help: 'บอกได้เลยว่ากำลังหาสินค้าอะไร หรืออยากให้หน้าร้านแสดงแบบไหน',
			pending: 'กำลังอ่านข้อความ…',
			offline: 'โหมดออฟไลน์',
			failed: 'ส่งข้อความไม่สำเร็จ ลองส่งอีกครั้งได้',
			history: 'บทสนทนา'
		}
	};
	const suggestions = [
		{ text: 'ขอแบบเรียบๆ ดูสเปกก่อน', locale: 'th' },
		{ text: 'I care about battery and light weight, under 1500 baht', locale: 'en' },
		{ text: 'ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ', locale: 'th' }
	] as const;
	const t = $derived(copy[locale]);

	const id = $props.id();
	let mobile = $state(false);
	let draft = $state('');
	let sendFailed = $state(false);
	let textbox = $state<HTMLTextAreaElement>();
	let trigger = $state<HTMLButtonElement>();
	let dialog = $state<HTMLDialogElement>();
	let history = $state<HTMLElement>();
	const remaining = $derived(
		suggestions
			.filter(
				({ text }) =>
					!messages.some((message) => message.role === 'shopper' && message.text === text)
			)
			.slice(0, messages.length === 0 ? 3 : largePrint ? (showingDeal ? 0 : 1) : 2)
	);

	onMount(() => {
		const breakpoint = window.matchMedia('(width < 1024px)');
		const update = () => {
			mobile = breakpoint.matches;
		};
		update();
		breakpoint.addEventListener('change', update);
		return () => breakpoint.removeEventListener('change', update);
	});

	$effect(() => {
		const latest = messages.at(-1);
		const viewport = history;
		if (!latest || !viewport) return;
		void tick().then(() => {
			if (viewport === history && (!mobile || dialog?.open)) scrollToLatest(viewport);
		});
	});

	function scrollToLatest(viewport: HTMLElement) {
		const row = viewport.lastElementChild;
		if (row) {
			viewport.scrollTop += row.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
		}
	}

	function send(text: string) {
		const message = text.trim();
		if (pending || !message || message.length > 1000) return;
		try {
			sendFailed = onSend(message) === false;
		} catch {
			sendFailed = true;
		}
		draft = sendFailed ? message : '';
	}

	function onEnter(event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
		event.preventDefault();
		send(draft);
	}

	function open() {
		dialog?.showModal();
		textbox?.focus({ preventScroll: true });
		if (history) scrollToLatest(history);
	}
</script>

{#snippet content()}
	<header>
		<h2 {id}>{t.title}</h2>
		{#if mobile}<button type="button" onclick={() => dialog?.close()}>{t.close}</button>{/if}
	</header>
	{#if !messages.length}<p>{t.help}</p>{/if}
	<div class="history" bind:this={history} role="log" aria-label={t.history} aria-live="polite">
		{#each messages as message (message.id)}
			<article
				class:shopper={message.role === 'shopper'}
				class:error={message.error}
				role={message.error ? 'alert' : undefined}
				lang={message.locale ?? locale}
			>
				<p>{message.text}</p>
				{#if message.offline}<p class="offline" lang={locale}>{t.offline}</p>{/if}
				{#if message.role === 'assistant' && !message.error}{@render renderReply?.(message)}{/if}
			</article>
		{/each}
	</div>
	{#if sendFailed}<p class="error" role="alert">{t.failed}</p>{/if}
	{#if pending}<p role="status">{pendingLabel ?? t.pending}</p>{/if}
	{#if remaining.length}
		<div class="suggestions">
			{#each remaining as suggestion (suggestion.text)}
				<button
					type="button"
					lang={suggestion.locale}
					disabled={pending}
					onclick={() => send(suggestion.text)}
				>
					{suggestion.text}
				</button>
			{/each}
		</div>
	{/if}
	<form
		onsubmit={(event) => {
			event.preventDefault();
			send(draft);
		}}
	>
		<label for={`${id}-message`}>{inputLabel ?? t.message}</label>
		<textarea
			id={`${id}-message`}
			bind:this={textbox}
			bind:value={draft}
			rows="2"
			maxlength="1000"
			onkeydown={onEnter}></textarea>
		<button type="submit" disabled={pending || !draft.trim()}>{t.send}</button>
	</form>
{/snippet}

{#if mobile}
	<button class="trigger" type="button" bind:this={trigger} aria-haspopup="dialog" onclick={open}>
		{t.title}
	</button>
	<dialog
		bind:this={dialog}
		aria-labelledby={id}
		lang={locale}
		class:large={largePrint}
		onclose={() => trigger?.focus()}
	>
		<div class="content">{@render content()}</div>
	</dialog>
{:else}
	<aside class="content" aria-label={t.title} lang={locale} class:large={largePrint}>
		{@render content()}
	</aside>
{/if}

<style>
	.content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
		padding: 1rem;
		border: 1px solid var(--seam, #e9e6dc);
		background: var(--surface, #fff);
		color: var(--ink, #16161a);
	}
	.large {
		font-size: max(1.25rem, 20px);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	h2,
	p {
		margin: 0;
	}
	h2 {
		font-size: 1.125em;
	}
	.history {
		overflow-y: auto;
		min-height: 0;
		max-height: 45dvh;
		display: grid;
		gap: 0.75rem;
	}
	article {
		padding: 0.5rem;
		overflow-wrap: anywhere;
		white-space: pre-wrap;
	}
	.shopper {
		max-width: 85%;
		justify-self: end;
		color: var(--surface, #fff);
		background: var(--ink, #16161a);
		border-radius: var(--radius, 4px);
	}
	.error {
		border: 1px solid var(--void, #b01e31);
	}
	.offline {
		color: var(--muted, #5d5d63);
	}
	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	button,
	textarea {
		min-height: var(--tap, 44px);
		font: inherit;
		border: 1px solid var(--ink, #16161a);
		border-radius: var(--radius, 4px);
		background: var(--surface, #fff);
		color: var(--ink, #16161a);
	}
	button {
		padding: 0.375rem 0.625rem;
	}
	.suggestions button {
		border-radius: 999px;
	}
	.large button,
	.large textarea {
		min-height: 48px;
	}
	button:focus-visible,
	textarea:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	form {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.375rem;
	}
	form label {
		grid-column: 1 / -1;
	}
	textarea {
		box-sizing: border-box;
		padding: 0.5rem;
		width: 100%;
		resize: vertical;
	}
	form button {
		align-self: end;
	}
	dialog {
		box-sizing: border-box;
		inset: auto 0 0;
		margin: 0;
		padding: 0;
		width: 100%;
		max-width: none;
		max-height: 80dvh;
		border: 0;
		border-top: 2px solid var(--ink, #16161a);
	}
	dialog .content {
		max-height: 80dvh;
		box-sizing: border-box;
		overflow: auto;
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}
</style>
