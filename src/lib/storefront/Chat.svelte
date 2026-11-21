<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';
	import type { FactLocale } from './verifyFacts';

	import type { ChatMessage, ChatSendResult } from './conversation.svelte';
	let {
		locale,
		messages,
		pending,
		canSupersede = false,
		onSend,
		renderReply,
		largePrint = false,
		openOnMount = false,
		showingDeal = false,
		inputLabel,
		pendingLabel
	}: {
		locale: FactLocale;
		messages: readonly ChatMessage[];
		pending: boolean;
		canSupersede?: boolean;
		onSend: (message: string) => ChatSendResult | Promise<ChatSendResult>;
		renderReply?: Snippet<[ChatMessage]>;
		largePrint?: boolean;
		openOnMount?: boolean;
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
			online: 'Online assistant',
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
			online: 'ผู้ช่วยออนไลน์',
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
	const sendBlocked = $derived(pending && !canSupersede);

	const id = $props.id();
	let ready = $state(false);
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
		ready = true;
		const breakpoint = window.matchMedia('(width < 1024px)');
		const update = () => {
			mobile = breakpoint.matches;
		};
		update();
		if (mobile && openOnMount) {
			void tick().then(() => {
				if (dialog?.isConnected && !dialog.open) open();
			});
		}
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

	async function send(text: string) {
		const message = text.trim();
		if (sendBlocked || !message || message.length > 1000) return;
		const originalDraft = draft;
		try {
			const result = await onSend(message);
			if (result === 'superseded') return;
			sendFailed = result === false;
		} catch {
			sendFailed = true;
		}
		if (draft === originalDraft) draft = sendFailed ? message : '';
	}

	function onEnter(event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
		event.preventDefault();
		void send(draft);
	}

	function open() {
		dialog?.showModal();
		textbox?.focus({ preventScroll: true });
		if (history) scrollToLatest(history);
	}
	export function focus() {
		if (mobile) open();
		else textbox?.focus();
	}
</script>

{#snippet content()}
	<header class="flex items-center justify-between gap-2">
		<h2 class="m-0 text-[1.125em]" {id}>{t.title}</h2>
		{#if mobile}<button
				class="min-h-[var(--tap,44px)] rounded-[var(--radius,4px)] border border-[var(--ink,#16161a)] bg-[var(--surface,#fff)] px-2.5 py-1.5 text-[var(--ink,#16161a)] group-[.large]/chat:min-h-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
				type="button"
				onclick={() => dialog?.close()}
			>
				{t.close}
			</button>{/if}
	</header>
	{#if !messages.length}<p class="m-0">{t.help}</p>{/if}
	<div
		class="history grid max-h-[45dvh] min-h-0 gap-3 overflow-y-auto"
		bind:this={history}
		role="log"
		aria-label={t.history}
		aria-live="polite"
	>
		{#each messages as message (message.id)}
			<article
				class={[
					'p-2 wrap-anywhere whitespace-pre-wrap [&.error]:border [&.error]:border-[var(--void,#b01e31)] [&.shopper]:max-w-[85%] [&.shopper]:justify-self-end [&.shopper]:rounded-[var(--radius,4px)] [&.shopper]:bg-[var(--ink,#16161a)] [&.shopper]:text-[var(--surface,#fff)]'
				]}
				class:shopper={message.role === 'shopper'}
				class:error={message.error}
				role={message.error ? 'alert' : undefined}
				lang={message.locale ?? locale}
			>
				<p class="m-0">{message.text}</p>
				{#if message.usedLocalSettings}<p
						class="offline m-0 text-[var(--muted,#5d5d63)]"
						lang={locale}
					>
						{locale === 'th' ? 'ใช้การตั้งค่าในเครื่อง' : 'Used local settings'}
					</p>{:else if message.offline}<p
						class="offline m-0 text-[var(--muted,#5d5d63)]"
						lang={locale}
					>
						{t.offline}
					</p>{:else if message.role === 'assistant' && message.offline === false}
					<p class="m-0 text-[var(--muted,#5d5d63)]" lang={locale}>{t.online}</p>
				{/if}
				{#if message.role === 'assistant' && !message.error}{@render renderReply?.(message)}{/if}
			</article>
		{/each}
	</div>
	{#if sendFailed}<p class="error m-0 border border-[var(--void,#b01e31)]" role="alert">
			{t.failed}
		</p>{/if}
	{#if pending}<p class="m-0" role="status">{pendingLabel ?? t.pending}</p>{/if}
	{#if remaining.length}
		<div class="suggestions flex flex-wrap gap-1.5">
			{#each remaining as suggestion (suggestion.text)}
				<button
					class="min-h-[var(--tap,44px)] rounded-[999px] border border-[var(--ink,#16161a)] bg-[var(--surface,#fff)] px-2.5 py-1.5 text-[var(--ink,#16161a)] group-[.large]/chat:min-h-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
					type="button"
					lang={suggestion.locale}
					disabled={!ready || sendBlocked}
					onclick={() => send(suggestion.text)}
				>
					{suggestion.text}
				</button>
			{/each}
		</div>
	{/if}
	<form
		class="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5"
		onsubmit={(event) => {
			event.preventDefault();
			void send(draft);
		}}
	>
		<label class="col-span-full" for={`${id}-message`}>{inputLabel ?? t.message}</label>
		<textarea
			class="box-border min-h-[var(--tap,44px)] w-full resize-y rounded-[var(--radius,4px)] border border-[var(--ink,#16161a)] bg-[var(--surface,#fff)] p-2 text-[var(--ink,#16161a)] group-[.large]/chat:min-h-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
			id={`${id}-message`}
			bind:this={textbox}
			bind:value={draft}
			rows="2"
			disabled={!ready}
			maxlength="1000"
			onkeydown={onEnter}></textarea>
		<button
			class="min-h-[var(--tap,44px)] self-end rounded-[var(--radius,4px)] border border-[var(--ink,#16161a)] bg-[var(--surface,#fff)] px-2.5 py-1.5 text-[var(--ink,#16161a)] group-[.large]/chat:min-h-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
			type="submit"
			disabled={!ready || sendBlocked || !draft.trim()}
		>
			{t.send}
		</button>
	</form>
{/snippet}

{#if mobile}
	<button
		class="trigger min-h-[var(--tap,44px)] rounded-[var(--radius,4px)] border border-[var(--ink,#16161a)] bg-[var(--surface,#fff)] px-2.5 py-1.5 text-[var(--ink,#16161a)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
		type="button"
		bind:this={trigger}
		aria-haspopup="dialog"
		onclick={open}
	>
		{t.title}
	</button>
	<dialog
		class={[
			'group/chat inset-[auto_0_0] m-0 box-border max-h-[80dvh] w-full max-w-none border-0 border-none p-0 [border-top:2px_solid_var(--ink,#16161a)] backdrop:bg-[rgb(0_0_0/40%)] [&.large]:text-[length:max(1.25rem,20px)]'
		]}
		bind:this={dialog}
		aria-labelledby={id}
		lang={locale}
		class:large={largePrint}
		onclose={() => trigger?.focus()}
	>
		<div
			class="content box-border flex max-h-[80dvh] min-w-0 flex-col gap-3 overflow-auto border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4 text-[var(--ink,#16161a)]"
		>
			{@render content()}
		</div>
	</dialog>
{:else}
	<aside
		class={[
			'content group/chat flex min-w-0 flex-col gap-3 border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4 text-[var(--ink,#16161a)] [&.large]:text-[length:max(1.25rem,20px)]'
		]}
		aria-label={t.title}
		lang={locale}
		class:large={largePrint}
	>
		{@render content()}
	</aside>
{/if}
