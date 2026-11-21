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

<header
	class="group/listing-header sticky top-0 z-1 flex items-center gap-[0.65rem] border-b border-[#e9e6dc] bg-white px-3 py-1.5 [@media(max-width:699px)]:pointer-events-none [@media(max-width:699px)]:-mb-[60px] [@media(max-width:699px)]:box-border [@media(max-width:699px)]:h-[60px] [@media(max-width:699px)]:gap-1 [@media(max-width:699px)]:bg-transparent [@media(max-width:699px)]:p-2 [@media(max-width:699px)]:[border:0] [@media(max-width:699px)]:data-[over-hero=false]:border-b [@media(max-width:699px)]:data-[over-hero=false]:border-b-[#e9e6dc] [@media(max-width:699px)]:data-[over-hero=false]:bg-white"
	data-over-hero={overHero}
	style:--listing-actions-height={actionsHeight + 'px'}
>
	<a
		class="back flex min-h-[var(--tap,44px)] flex-[0_0_var(--tap,44px)] items-center justify-center text-inherit [@media(max-width:699px)]:pointer-events-auto [@media(max-width:699px)]:me-[0.2rem] [@media(max-width:699px)]:box-border [@media(max-width:699px)]:min-w-[var(--tap,44px)] [@media(max-width:699px)]:rounded-[999px] [@media(max-width:699px)]:bg-[#27394e] [@media(max-width:699px)]:text-white [@media(max-width:699px)]:no-underline [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:bg-white [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:text-[#16161a]"
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
	<span
		class="hero-space hidden [@media(max-width:699px)]:block [@media(max-width:699px)]:flex-1 [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:hidden"
		aria-hidden="true"
	></span>
	<a
		class="header-search flex min-h-[var(--tap,44px)] min-w-0 flex-1 items-center gap-2 bg-[#f4f4f4] px-[0.65rem] text-inherit [@media(max-width:699px)]:pointer-events-auto [@media(max-width:699px)]:box-border [@media(max-width:699px)]:flex-[0_0_var(--tap,44px)] [@media(max-width:699px)]:justify-center [@media(max-width:699px)]:rounded-[999px] [@media(max-width:699px)]:bg-[#27394e] [@media(max-width:699px)]:p-0 [@media(max-width:699px)]:text-white [@media(max-width:699px)]:no-underline [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:flex-auto [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:justify-start [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:rounded [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:bg-[#f4f4f4] [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:px-[0.65rem] [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:text-[#16161a]"
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
		<span
			class="[@media(max-width:699px)]:hidden [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:inline"
		>
			{th ? 'ค้นหาสินค้า' : 'Search products'}
		</span>
	</a>
	{#key data.id + data.language + data.theme}
		<ListingShare {data} {overHero} showStrip={inDetails && !overHero} />
	{/key}
	<a
		class="language flex min-h-[var(--tap,44px)] items-center justify-center text-inherit [min-inline-size:var(--tap,44px)] [@media(max-width:699px)]:pointer-events-auto [@media(max-width:699px)]:box-border [@media(max-width:699px)]:min-w-[var(--tap,44px)] [@media(max-width:699px)]:rounded-[999px] [@media(max-width:699px)]:bg-[#27394e] [@media(max-width:699px)]:px-[0.55rem] [@media(max-width:699px)]:text-white [@media(max-width:699px)]:no-underline [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:bg-white [@media(max-width:699px)]:group-data-[over-hero=false]/listing-header:text-[#16161a]"
		href={resolve(
			`/product/[id]?lang=${th ? 'en' : 'th'}${data.theme === 'standard' ? '' : `&theme=${data.theme}`}${data.receiptQuery ? '&' + data.receiptQuery : ''}`,
			{
				id: data.pathId
			}
		)}
	>
		{th ? 'English' : 'ไทย'}
	</a>
	{#if children}<div
			class={[
				'header-actions [@media(max-width:699px)]:pointer-events-auto [@media(max-width:699px)]:group-data-[over-hero=true]/listing-header:[&_button[popovertarget]]:rounded-[999px] [@media(max-width:699px)]:group-data-[over-hero=true]/listing-header:[&_button[popovertarget]]:border-transparent [@media(max-width:699px)]:group-data-[over-hero=true]/listing-header:[&_button[popovertarget]]:bg-[#27394e] [@media(max-width:699px)]:group-data-[over-hero=true]/listing-header:[&_button[popovertarget]]:text-white [@media(max-width:699px)]:group-data-[over-hero=true]/listing-header:[&_button[popovertarget]]:[min-inline-size:var(--tap,44px)]'
			]}
		>
			{@render children()}
		</div>{/if}
</header>
{#if !overHero}
	<button
		type="button"
		class={[
			'back-to-top hidden focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid [&.above-share]:bottom-[calc(var(--listing-actions-height)+var(--tap,44px)+0.65rem)] [@media(max-width:699px)]:fixed [@media(max-width:699px)]:end-[0.65rem] [@media(max-width:699px)]:bottom-[calc(var(--listing-actions-height)+0.65rem)] [@media(max-width:699px)]:z-1 [@media(max-width:699px)]:grid [@media(max-width:699px)]:size-[var(--tap,44px)] [@media(max-width:699px)]:cursor-pointer [@media(max-width:699px)]:place-items-center [@media(max-width:699px)]:rounded-[50%] [@media(max-width:699px)]:border [@media(max-width:699px)]:border-[var(--seam,#e9e6dc)] [@media(max-width:699px)]:bg-white [@media(max-width:699px)]:text-[var(--accent,#16161a)]'
		]}
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
