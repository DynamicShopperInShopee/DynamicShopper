<script lang="ts">
	import { onDestroy } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { defaultPlan, interpretOffline, type Turn } from '../personalization';
	import type { Locale } from '../catalog';
	import type { ChatSendResult } from './conversation.svelte';
	import { getStoreSession } from './store.svelte';
	import { quoteBasket } from './quoteBasket';
	import ShoppingAssistant from './ShoppingAssistant.svelte';

	let {
		productId,
		locale,
		theme
	}: {
		productId: string;
		locale: Locale;
		theme: string;
	} = $props();
	const session = getStoreSession();
	const displayTheme = $derived(
		theme === 'large' || theme === 'minimal' || theme === 'vibrant' ? theme : 'standard'
	);
	let pending = $state<'navigation' | 'quote'>();
	let generation = 0;
	let handoff: { turn: Turn; target: string } | undefined;
	function supersede() {
		generation += 1;
		pending = undefined;
	}
	beforeNavigate(({ from, to }) => {
		if (from?.url.pathname === to?.url.pathname && from?.url.search === to?.url.search) return;
		if (handoff && to && to.url.pathname + to.url.search === handoff.target) return;
		if (handoff) session.listing.cancel(handoff.turn);
		handoff = undefined;
		supersede();
	});
	onDestroy(supersede);

	async function send(text: string): Promise<ChatSendResult> {
		if (pending) return 'superseded';
		const request = ++generation;
		const language = /\p{Script=Thai}/u.test(text) ? 'th' : locale;
		const plan = { ...(session.visit?.plan ?? session.savedPlan ?? defaultPlan), locale };
		const turn = interpretOffline(text, plan, productId);
		if (turn.intent === 'change' || turn.intent === 'undo' || turn.intent === 'reset') {
			pending = 'navigation';
			const query = new SvelteURLSearchParams(session.visit?.search);
			query.set('view', 'receipt');
			const target = resolve(`/?${query.toString()}`);
			handoff = { turn, target };
			session.listing.queue(turn, text, language);
			try {
				await goto(target);
				return true;
			} catch {
				session.listing.cancel(turn);
				return request === generation ? false : 'superseded';
			} finally {
				if (request === generation) {
					handoff = undefined;
					pending = undefined;
				}
			}
		}
		let deal: ReturnType<typeof quoteBasket>;
		if (turn.intent === 'deal' && turn.productIds.length) {
			pending = 'quote';
			try {
				await session.cartSettled();
				if (request !== generation) return 'superseded';
				const basket = turn.productIds.map((id) => ({
					productId: id,
					quantity: session.cart.find((item) => item.productId === id)?.quantity ?? 1
				}));
				deal = quoteBasket(basket, language, session.clock.context);
			} finally {
				if (request === generation) pending = undefined;
			}
		}
		session.conversation.shopper(text, language);
		session.conversation.reply(turn, { locale: language, offline: true, changes: [], deal });
		return true;
	}
</script>

<div class="listing-chat">
	<ShoppingAssistant
		{locale}
		theme={displayTheme}
		largePrint={theme === 'large'}
		pending={pending !== undefined}
		pendingLabel={pending === 'navigation'
			? locale === 'th'
				? 'กำลังเปิดหน้าร้าน…'
				: 'Opening the store…'
			: locale === 'th'
				? 'กำลังตรวจราคา…'
				: 'Checking the price…'}
		onSend={send}
		conversation={session.conversation}
	/>
</div>

<style>
	@media (min-width: 1024px) {
		:global(main):has(.listing-chat) {
			--chat-width: clamp(20rem, 28vw, 28rem);
			margin-inline-end: var(--chat-width);
		}
	}
	@media (max-width: 699px) {
		.listing-chat :global(.trigger) {
			bottom: calc(64px + 1rem + env(safe-area-inset-bottom));
		}
	}
</style>
