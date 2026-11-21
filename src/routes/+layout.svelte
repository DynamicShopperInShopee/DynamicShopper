<script lang="ts">
	import './layout.css';
	import '#lib/storefront/theme.css';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import {
		setStoreSession,
		createStoreSession,
		returnToStore
	} from '#lib/storefront/store.svelte.ts';
	import { onMount } from 'svelte';
	import { afterNavigate, preloadCode } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const session = createStoreSession();
	onMount(() => {
		const stopClock = session.clock.start();
		session.restoreBrowser();
		return stopClock;
	});
	setStoreSession(session);
	const missingListing = $derived(
		page.status === 404 && /\/product\/[^/]+\/?$/.test(page.url.pathname)
	);
	const language = $derived(page.url.searchParams.get('lang') === 'th' ? 'th' : 'en');
	const requestedTheme = $derived(page.url.searchParams.get('theme'));
	const theme = $derived(
		requestedTheme === 'large'
			? 'large-print'
			: requestedTheme === 'minimal' || requestedTheme === 'vibrant'
				? requestedTheme
				: 'standard'
	);

	afterNavigate(({ to }) => {
		const route = to?.route.id;
		if (
			session.offlineReady ||
			(route !== '/' && route !== '/compare' && route !== '/product/[id]')
		)
			return;
		// Keep client-side navigation available when the connection drops after the first visit.
		void Promise.all([preloadCode('/'), preloadCode('/compare'), preloadCode('/product/[id]')])
			.then(() => {
				session.offlineReady = true;
			})
			.catch(() => {
				session.offlineReady = false;
			});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if missingListing}
	<main class="missing" lang={language} data-storefront-theme={theme}>
		<section>
			<h1>{language === 'th' ? 'ไม่พบสินค้า' : 'Product not found'}</h1>
			<a href={resolve(returnToStore(session))}>
				{language === 'th' ? 'กลับหน้าร้าน' : 'Back to the store'}
			</a>
		</section>
	</main>
{:else}
	{@render children()}
{/if}

<style>
	.missing {
		min-height: 100dvh;
		padding: clamp(1rem, 4vw, 3rem);
	}
	.missing section {
		max-width: 30rem;
		margin: auto;
		padding: 1rem;
		background: var(--surface);
		border: 1px solid var(--seam);
	}
	.missing h1 {
		font-size: 1.4em;
		font-weight: 600;
	}
	.missing a {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap);
		text-decoration: underline;
	}
</style>
