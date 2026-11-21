<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { carrySearchToListing, readSearchSelection } from '../../search-navigation';
	import { readInterviewVisit } from '../../interview-navigation';
	import ListingShare from './ListingShare.svelte';
	import type { PageData } from './$types';
	let {
		data,
		hero,
		backQuery,
		children
	}: { data: PageData; hero?: HTMLElement; backQuery: string; children?: Snippet } = $props();
	const th = $derived(data.language === 'th');
	let overHero = $state(true);
	let backLink: HTMLAnchorElement;
	let inDetails = $state(false);
	let actionsHeight = $state(50);
	function originSelection() {
		const value = page.state.storeSearch;
		return typeof value === 'string' && readInterviewVisit(value)
			? value
			: readSearchSelection(value);
	}
	carrySearchToListing(originSelection);
	function returnToShelf(event: MouseEvent) {
		const selection = originSelection();
		const interview = readInterviewVisit(selection);
		if (
			!selection ||
			(data.receiptQuery && !interview) ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		)
			return;
		event.preventDefault();
		void goto(resolve('/') + (interview?.search ?? ''), { state: { storeSearch: selection } });
	}
	$effect(() => {
		if (!hero) return;
		const main = hero.closest('main');
		const details = main?.querySelector('#details');
		const actions = main?.querySelector('nav.actions');
		if (!details || !actions) return;
		const visibility = new IntersectionObserver(
			([entry]) => {
				inDetails = entry.isIntersecting;
			},
			{ rootMargin: '-60px 0px -120px' }
		);
		const size = new ResizeObserver(() => {
			actionsHeight = actions.getBoundingClientRect().height;
			main?.style.setProperty('--listing-actions-height', actionsHeight + 'px');
		});
		visibility.observe(details);
		size.observe(actions);
		return () => {
			visibility.disconnect();
			size.disconnect();
			main?.style.removeProperty('--listing-actions-height');
		};
	});
	$effect(() => {
		if (!hero) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				overHero = entry.isIntersecting;
			},
			{ rootMargin: '-60px 0px 0px' }
		);
		observer.observe(hero);
		return () => observer.disconnect();
	});
</script>

<header data-over-hero={overHero} style:--listing-actions-height={actionsHeight + 'px'}>
	<a
		class="back"
		bind:this={backLink}
		href={resolve(backQuery ? `/?${backQuery}` : '/')}
		onclick={returnToShelf}
		aria-label={th ? 'กลับหน้าร้าน' : 'Back to store'}
	>
		<svg
			viewBox="0 0 24 24"
			width="24"
			height="24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			aria-hidden="true"
		>
			<path d="M21 12H4m7-7-7 7 7 7" />
		</svg>
	</a>
	<span class="hero-space" aria-hidden="true"></span>
	<a
		class="header-search"
		href={resolve(backQuery ? `/?${backQuery}` : '/')}
		onclick={returnToShelf}
		aria-label={th ? 'ค้นหาสินค้า' : 'Search products'}
	>
		<svg
			viewBox="0 0 20 20"
			width="18"
			height="18"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			aria-hidden="true"
		>
			<circle cx="8" cy="8" r="5" /><path d="m12 12 5 5" />
		</svg>
		<span>{th ? 'ค้นหาสินค้า' : 'Search products'}</span>
	</a>
	{#key data.id + data.language + data.theme}
		<ListingShare {data} {overHero} showStrip={inDetails && !overHero} />
	{/key}
	<a
		class="language"
		href={resolve(
			`/product/[id]?lang=${th ? 'en' : 'th'}${data.theme === 'standard' ? '' : `&theme=${data.theme}`}${data.receiptQuery ? '&' + data.receiptQuery : ''}`,
			{
				id: data.pathId
			}
		)}
	>
		{th ? 'English' : 'ไทย'}
	</a>
	{#if children}<div class="header-actions">{@render children()}</div>{/if}
</header>
{#if !overHero}
	<button
		type="button"
		class="back-to-top"
		class:above-share={inDetails}
		style:--listing-actions-height={actionsHeight + 'px'}
		aria-label={th ? 'กลับขึ้นด้านบน' : 'Back to top'}
		onclick={() => {
			window.scrollTo({ top: 0, behavior: 'instant' });
			backLink.focus({ preventScroll: true });
		}}
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width="24"
			height="24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.7"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M3 3h18m-9 18V7m-7 7 7-7 7 7" />
		</svg>
	</button>
{/if}

<style>
	header {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		border-bottom: 1px solid #e9e6dc;
		position: sticky;
		top: 0;
		z-index: 1;
		background: #fff;
		padding: 0.375rem 0.75rem;
	}
	header a {
		min-height: var(--tap, 44px);
		display: flex;
		align-items: center;
		color: inherit;
	}
	.hero-space {
		display: none;
	}
	.back {
		flex: 0 0 var(--tap, 44px);
		justify-content: center;
	}
	.header-search {
		flex: 1;
		min-width: 0;
		gap: 0.5rem;
		padding-inline: 0.65rem;
		background: #f4f4f4;
	}
	.language {
		min-inline-size: var(--tap, 44px);
		justify-content: center;
	}
	.back-to-top {
		display: none;
	}
	@media (max-width: 699px) {
		.back-to-top {
			display: grid;
			place-items: center;
			position: fixed;
			inset-inline-end: 0.65rem;
			bottom: calc(var(--listing-actions-height) + 0.65rem);
			z-index: 1;
			width: var(--tap, 44px);
			height: var(--tap, 44px);
			border-radius: 50%;
			border: 1px solid var(--seam, #e9e6dc);
			background: #fff;
			color: var(--accent, #16161a);
			cursor: pointer;
		}
		.back-to-top.above-share {
			bottom: calc(var(--listing-actions-height) + var(--tap, 44px) + 0.65rem);
		}
		.back-to-top:focus-visible {
			outline: 2px solid currentColor;
		}
		header {
			height: 60px;
			box-sizing: border-box;
			margin-bottom: -60px;
			border: 0;
			background: transparent;
			padding: 8px;
			gap: 4px;
			pointer-events: none;
		}
		header a {
			box-sizing: border-box;
			min-width: var(--tap, 44px);
			justify-content: center;
			background: #27394e;
			color: white;
			border-radius: 999px;
			text-decoration: none;
			pointer-events: auto;
		}
		header .back {
			margin-inline-end: 0.2rem;
		}
		.hero-space {
			display: block;
			flex: 1;
		}
		header .header-search {
			background: #27394e;
			flex: 0 0 var(--tap, 44px);
			padding: 0;
		}
		.header-search span {
			display: none;
		}
		.language {
			padding-inline: 0.55rem;
			font-size: inherit;
		}
		.header-actions {
			pointer-events: auto;
		}
		header[data-over-hero='true'] .header-actions :global(button[popovertarget]) {
			min-inline-size: var(--tap, 44px);
			border-color: transparent;
			border-radius: 999px;
			background: #27394e;
			color: #fff;
		}
		header[data-over-hero='false'] {
			background: #fff;
			border-bottom: 1px solid #e9e6dc;
		}
		header[data-over-hero='false'] .hero-space {
			display: none;
		}
		header[data-over-hero='false'] a {
			color: #16161a;
			background: #fff;
		}
		header[data-over-hero='false'] .header-search {
			flex: 1 1 auto;
			justify-content: flex-start;
			padding-inline: 0.65rem;
			background: #f4f4f4;
			border-radius: 4px;
		}
		header[data-over-hero='false'] .header-search span {
			display: inline;
		}
	}
</style>
