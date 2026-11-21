<script lang="ts">
	import { resolve } from '$app/paths';
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
		canSupersede = false,
		largePrint = false,
		openOnMount = false,
		pendingLabel,
		theme = 'standard'
	}: {
		locale: Locale;
		onSend: (message: string) => ChatSendResult | Promise<ChatSendResult>;
		conversation: Conversation;
		pending?: boolean;
		canSupersede?: boolean;
		largePrint?: boolean;
		openOnMount?: boolean;
		pendingLabel?: string;
		theme?: 'standard' | 'minimal' | 'vibrant' | 'large';
	} = $props();

	let chat = $state<{ focus: () => void }>();
	export function focus() {
		chat?.focus();
	}

	function listingHref(id: string, lang: Locale) {
		return resolve(`/product/[id]?lang=${lang}&theme=${theme}&view=receipt`, { id });
	}
</script>

<div
	class={[
		'shopping-assistant min-[1024px]:[&_.history]:max-h-none min-[1024px]:[&_.history]:flex-1 min-[1024px]:[&_.history]:content-start max-[1023px]:[&_.trigger]:fixed max-[1023px]:[&_.trigger]:end-4 max-[1023px]:[&_.trigger]:bottom-[calc(1rem+env(safe-area-inset-bottom))] max-[1023px]:[&_.trigger]:z-[2] max-[1023px]:[&_.trigger]:bg-[var(--ink,#16161a)] max-[1023px]:[&_.trigger]:text-[var(--surface,white)] max-[1023px]:[&_aside]:hidden min-[1024px]:[&_aside]:fixed min-[1024px]:[&_aside]:inset-[0_0_0_auto] min-[1024px]:[&_aside]:z-[2] min-[1024px]:[&_aside]:box-border min-[1024px]:[&_aside]:w-[var(--chat-width,24rem)] min-[1024px]:[&_aside]:overflow-auto max-[1023px]:[.store:has(&)]:pb-[calc(var(--tap,44px)+2rem+env(safe-area-inset-bottom))] min-[1024px]:[.store:has(&)]:pe-[var(--chat-width)] min-[1024px]:[.store:has(&)]:[--chat-width:clamp(20rem,28vw,28rem)]'
	]}
>
	<Chat
		bind:this={chat}
		{locale}
		{pending}
		{canSupersede}
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
				<section
					class="changes my-2 border-y border-dashed border-[var(--muted,#5d5d63)] p-3"
					aria-label={lang === 'th' ? 'สิ่งที่เปลี่ยน' : 'What changed'}
				>
					<h3 class="font-semibold text-[inherit]">
						{lang === 'th' ? 'สิ่งที่เปลี่ยน' : 'What changed'}
					</h3>
					<ul class="mt-1.5 mb-0 list-none p-0">
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
				<ul class="mentioned my-1.5 list-none p-0">
					{#each message.productIds as id (id)}
						{@const name = resolveCatalogFact(id, 'name', lang)}
						{#if name}<li>
								<a
									class="inline-flex min-h-[var(--tap,44px)] items-center underline"
									href={resolve(`/product/[id]?lang=${lang}&theme=${theme}&view=receipt`, { id })}
								>
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
