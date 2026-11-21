<script lang="ts">
	import { onDestroy } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { defaultPlan, interpretOffline } from '../personalization';
	import type { Locale } from '../catalog';
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
	let active = true;
	onDestroy(() => {
		active = false;
	});

	async function send(text: string) {
		if (pending) return false;
		const language = /\p{Script=Thai}/u.test(text) ? 'th' : locale;
		const plan = { ...(session.visit?.plan ?? session.savedPlan ?? defaultPlan), locale };
		const turn = interpretOffline(text, plan, productId);
		if (turn.intent === 'change' || turn.intent === 'undo' || turn.intent === 'reset') {
			pending = 'navigation';
			session.listing.queue(turn, text, language);
			try {
				const query = new SvelteURLSearchParams(session.visit?.search);
				query.set('view', 'receipt');
				await goto(resolve(`/?${query.toString()}`));
				return true;
			} catch {
				session.listing.cancel(turn);
				return false;
			} finally {
				pending = undefined;
			}
		}
		let deal: ReturnType<typeof quoteBasket>;
		if (turn.intent === 'deal' && turn.productIds.length) {
			const focused = productId;
			pending = 'quote';
			try {
				await session.cartSettled();
				if (!active || productId !== focused) return false;
				const basket = turn.productIds.map((id) => ({
					productId: id,
					quantity: session.cart.find((item) => item.productId === id)?.quantity ?? 1
				}));
				deal = quoteBasket(basket, language);
			} finally {
				pending = undefined;
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
