<script lang="ts">
	import './layout.css';
	import { setStoreSession, type StoreSession } from '#lib/storefront/store.svelte.ts';
	import { afterNavigate, preloadCode } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const session = $state<StoreSession>({ offlineReady: false });
	setStoreSession(session);
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

{@render children()}
