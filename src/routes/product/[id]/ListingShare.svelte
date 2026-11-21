<script lang="ts">
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';

	let { data, overHero, showStrip }: { data: PageData; overHero: boolean; showStrip: boolean } =
		$props();
	const th = $derived(data.language === 'th');
	let manual = $state<HTMLDialogElement>();
	let input = $state<HTMLInputElement>();
	let shareButton = $state<HTMLButtonElement>();
	let originButton: HTMLButtonElement | undefined;
	let busy = $state(false);
	let link = $state('');
	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;
	onDestroy(() => {
		disposed = true;
		clearTimeout(timer);
	});

	async function share(event: MouseEvent & { currentTarget: HTMLButtonElement }) {
		if (disposed || busy) return;
		originButton = event.currentTarget;
		const url = new URL(resolve('/product/[id]', { id: data.id }), window.location.origin);
		url.searchParams.set('lang', data.language);
		url.searchParams.set('theme', data.theme);
		const canonical = url.href;
		busy = true;
		copied = false;
		clearTimeout(timer);
		try {
			if (navigator.share) {
				try {
					await navigator.share({ title: data.name.text, url: canonical });
					return;
				} catch (error) {
					if (disposed || (error instanceof Error && error.name === 'AbortError')) return;
				}
			}
			if (navigator.clipboard?.writeText) {
				try {
					await navigator.clipboard.writeText(canonical);
					if (disposed) return;
					copied = true;
					timer = setTimeout(() => (copied = false), 4000);
					return;
				} catch {
					// Clipboard access can be restricted by browser permissions.
				}
			}
			if (disposed) return;
			link = canonical;
			manual?.showModal();
			if (input) {
				input.value = canonical;
				input.focus();
				input.select();
			}
		} finally {
			if (!disposed) busy = false;
		}
	}

	function restoreFocus() {
		const target =
			originButton?.isConnected && originButton.offsetWidth > 0 ? originButton : shareButton;
		target?.focus({ preventScroll: true });
	}
</script>

<button
	class={[
		'icon pointer-events-auto grid min-h-[var(--tap,44px)] w-[var(--tap,44px)] flex-[0_0_var(--tap,44px)] cursor-pointer place-items-center rounded-[50%] bg-transparent text-[var(--accent,#16161a)] [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-current focus-visible:outline-solid [@media(max-width:699px)]:[&.over-hero]:bg-[#27394e] [@media(max-width:699px)]:[&.over-hero]:text-white'
	]}
	class:over-hero={overHero}
	bind:this={shareButton}
	type="button"
	aria-label={th ? 'แชร์สินค้า' : 'Share product'}
	aria-busy={busy}
	onclick={share}
>
	<svg
		aria-hidden="true"
		width="25"
		height="25"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.65"
		stroke-linejoin="round"
	>
		<path d="m14 3 8 7-8 7v-4.5C9 12.5 5 15 2 20c1-8.5 5.5-13 12-13z" />
	</svg>
</button>

{#if showStrip}
	<div
		class="strip hidden [@media(max-width:699px)]:fixed [@media(max-width:699px)]:inset-x-0 [@media(max-width:699px)]:bottom-[var(--listing-actions-height)] [@media(max-width:699px)]:flex [@media(max-width:699px)]:h-[var(--tap,44px)] [@media(max-width:699px)]:items-center [@media(max-width:699px)]:justify-between [@media(max-width:699px)]:gap-2 [@media(max-width:699px)]:bg-[#373737] [@media(max-width:699px)]:px-3 [@media(max-width:699px)]:text-[max(0.875rem,var(--action-font-floor,0rem))] [@media(max-width:699px)]:text-white"
	>
		<span>{th ? 'แชร์สินค้านี้' : 'Share this product'}</span>
		<button
			class="pointer-events-auto h-full min-w-[var(--tap,44px)] cursor-pointer px-[0.65rem] text-inherit underline [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-current focus-visible:outline-solid"
			type="button"
			onclick={share}
			aria-busy={busy}
		>
			{th ? 'แชร์' : 'Share'}
		</button>
	</div>
{/if}
<div
	class={[
		'feedback [&:not(:empty)]:pointer-events-none [&:not(:empty)]:absolute [&:not(:empty)]:end-3 [&:not(:empty)]:top-full [&:not(:empty)]:rounded [&:not(:empty)]:bg-[#16161a] [&:not(:empty)]:px-3 [&:not(:empty)]:py-[0.4rem] [&:not(:empty)]:text-white'
	]}
	role="status"
>
	{copied ? (th ? 'คัดลอกลิงก์แล้ว' : 'Link copied') : ''}
</div>
<dialog
	class="pointer-events-auto m-auto w-[min(calc(100%-2rem),28rem)] rounded-lg border border-[var(--seam,#e9e6dc)] bg-white p-[1.1rem] text-[#16161a] backdrop:bg-[rgb(0_0_0/40%)]"
	bind:this={manual}
	aria-labelledby="share-dialog-title"
	onclose={restoreFocus}
>
	<h2 class="mx-0 mt-0 mb-3 font-semibold" id="share-dialog-title">
		{th ? 'แชร์ลิงก์สินค้า' : 'Share product link'}
	</h2>
	<label for="share-url">{th ? 'เลือกลิงก์เพื่อคัดลอก' : 'Select the link to copy it'}</label>
	<input
		class="mx-0 mt-[0.4rem] mb-[0.85rem] block min-h-[var(--tap,44px)] w-full border border-[#777] px-2 [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-current focus-visible:outline-solid"
		id="share-url"
		readonly
		type="url"
		bind:this={input}
		value={link}
		onfocus={(e) => e.currentTarget.select()}
	/>
	<form method="dialog">
		<button
			class="pointer-events-auto block min-h-[var(--tap,44px)] w-full cursor-pointer rounded bg-[#16161a] text-white [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-current focus-visible:outline-solid"
		>
			{th ? 'เสร็จสิ้น' : 'Done'}
		</button>
	</form>
</dialog>
