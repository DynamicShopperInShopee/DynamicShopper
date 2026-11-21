<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { Locale } from '#lib/contracts.ts';
	import Chat from './Chat.svelte';
	import type { Conversation, ChatMessage, ChatSendResult } from './conversation.svelte';
	import CitationSlip from './CitationSlip.svelte';
	import DealSlip from './DealSlip.svelte';
	import { resolveCatalogFact } from './catalogFact';
	import Fact from './Fact.svelte';

	let {
		locale,
		onSend,
		conversation,
		pending = false,
		largePrint = false,
		openOnMount = false,
		pendingLabel,
		theme = 'standard',
		listingQuery = 'view=receipt',
		factRoot = $bindable()
	}: {
		locale: Locale;
		onSend: (message: string) => ChatSendResult | Promise<ChatSendResult>;
		conversation: Conversation;
		pending?: boolean;
		largePrint?: boolean;
		openOnMount?: boolean;
		pendingLabel?: string;
		theme?: 'standard' | 'minimal' | 'vibrant' | 'large';
		listingQuery?: string;
		factRoot?: HTMLElement;
	} = $props();

	function listingHref(id: string, lang: Locale) {
		const params = new SvelteURLSearchParams({ lang, theme, view: 'receipt' });
		const look = new SvelteURLSearchParams(listingQuery).get('look');
		if (look) params.set('look', look);
		return resolve(`/product/[id]?${params}`, { id });
	}
</script>

<div class="shopping-assistant" bind:this={factRoot}>
	<Chat
		{locale}
		{pending}
		{onSend}
		{largePrint}
		{openOnMount}
		messages={conversation.messages}
		showingDeal={Boolean(conversation.messages.at(-1)?.deal)}
		inputLabel={locale === 'th' ? 'ถามหน้าร้าน' : 'Ask the store'}
		pendingLabel={pendingLabel ?? (locale === 'th' ? 'กำลังทดสอบโมเดล' : 'Testing the live model')}
	>
		{#snippet renderReply(message: ChatMessage)}
			{@const lang = message.locale ?? locale}
			{#if message.changes?.length}
				<section class="changes" aria-label={lang === 'th' ? 'สิ่งที่เปลี่ยน' : 'What changed'}>
					<h3>{lang === 'th' ? 'สิ่งที่เปลี่ยน' : 'What changed'}</h3>
					<ul>
						{#each message.changes as change (change)}<li>{change}</li>{/each}
					</ul>
				</section>
			{/if}
			{#if message.citations?.length}
				<CitationSlip
					citations={message.citations}
					locale={lang}
					resolve={resolveCatalogFact}
					listingHref={(id: string) => listingHref(id, lang)}
				/>
			{/if}
			{#if message.productIds?.length}
				<ul class="mentioned">
					{#each message.productIds as id (id)}
						{@const name = resolveCatalogFact(id, 'name', lang)}
						{#if name}<li>
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- listingHref resolves the route. -->
								<a href={listingHref(id, lang)}>
									<Fact fact={name} />
								</a>
							</li>{/if}
					{/each}
				</ul>
			{/if}
			{#if message.deal}<DealSlip {...message.deal} />{/if}
		{/snippet}
	</Chat>
</div>

<style>
	.changes {
		margin-block: 0.5rem;
		padding: 0.75rem;
		border-block: 1px dashed var(--muted, #5d5d63);
	}
	h3 {
		font-size: inherit;
		font-weight: 600;
	}
	.changes ul {
		list-style: none;
		margin: 0.375rem 0 0;
		padding: 0;
	}
	.mentioned {
		list-style: none;
		margin: 0.375rem 0;
		padding: 0;
	}
	.mentioned a {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap, 44px);
		text-decoration: underline;
	}
	@media (min-width: 1024px) {
		:global(.store):has(.shopping-assistant) {
			--chat-width: clamp(20rem, 28vw, 28rem);
			padding-inline-end: var(--chat-width);
		}
		.shopping-assistant :global(aside) {
			position: fixed;
			inset: 0 0 0 auto;
			z-index: 2;
			width: var(--chat-width, 24rem);
			box-sizing: border-box;
			overflow: auto;
		}
		.shopping-assistant :global(.history) {
			flex: 1;
			max-height: none;
			align-content: start;
		}
	}
	@media (max-width: 1023px) {
		:global(.store):has(.shopping-assistant) {
			padding-bottom: calc(var(--tap, 44px) + 2rem + env(safe-area-inset-bottom));
		}
		.shopping-assistant :global(.trigger) {
			position: fixed;
			z-index: 2;
			inset-inline-end: 1rem;
			bottom: calc(1rem + env(safe-area-inset-bottom));
			color: var(--surface, white);
			background: var(--ink, #16161a);
		}
		.shopping-assistant :global(aside) {
			display: none;
		}
	}
</style>
