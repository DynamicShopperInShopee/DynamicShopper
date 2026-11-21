<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { assistantCopy } from './copy';
	import type { FactLocale } from './verifyFacts';

	let {
		open = $bindable(false),
		locale,
		returnFocus,
		id = 'store-xray',
		children
	}: {
		open?: boolean;
		locale: FactLocale;
		returnFocus?: HTMLElement;
		id?: string;
		children: Snippet;
	} = $props();

	const desktop = new MediaQuery('(min-width: 1024px)');
	let sheet = $state<HTMLDialogElement>();
	let closeButton = $state<HTMLButtonElement>();
	let previousFocus: HTMLElement | undefined;
	let wasOpen = false;

	$effect(() => {
		if (!open) {
			if (wasOpen) (untrack(() => returnFocus) ?? previousFocus)?.focus();
			wasOpen = false;
			return;
		}

		if (!wasOpen) {
			const active = document.activeElement;
			previousFocus = active instanceof HTMLElement ? active : undefined;
			wasOpen = true;
		}
		if (sheet && !sheet.open) sheet.showModal();
		closeButton?.focus();
	});

	function close() {
		open = false;
	}

	function handleDesktopEscape(event: KeyboardEvent) {
		if (!desktop.current || !open || event.defaultPrevented || event.key !== 'Escape') return;
		if (event.target instanceof Element && event.target.closest('dialog[open], :popover-open')) {
			return;
		}
		event.preventDefault();
		close();
	}
</script>

<svelte:window onkeydown={handleDesktopEscape} />

{#snippet contents()}
	<div class="actions mb-2 flex justify-end">
		<button
			class="min-h-[var(--tap,44px)] min-w-[var(--tap,44px)] cursor-pointer rounded-[var(--radius,4px)] border border-current bg-[var(--surface,#fff)] px-3 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)]"
			type="button"
			bind:this={closeButton}
			onclick={close}
		>
			{locale === 'th' ? 'ปิดการดูขั้นตอน' : 'Close X-ray'}
		</button>
	</div>
	<div
		class={[
			'proof-content [&_>_section]:max-w-none [&_>_section]:border-0 [&_>_section]:border-none [&_>_section]:p-0'
		]}
	>
		{@render children()}
	</div>
{/snippet}

{#if open}
	{#if desktop.current}
		<div
			class="anchor pointer-events-none sticky inset-bs-[var(--xray-sticky-offset,0px)] z-[2] h-0"
		>
			<aside
				{id}
				lang={locale}
				aria-label={assistantCopy[locale].trace}
				class="drawer pointer-events-auto ms-auto box-border max-h-[calc(100dvh-var(--xray-sticky-offset,0px))] w-[min(100%,320px)] min-w-0 overflow-auto overscroll-contain bg-[var(--surface,#fff)] p-4 wrap-anywhere text-[var(--ink,#16161a)] [border-inline-start:1px_solid_var(--ink,#16161a)]"
			>
				{@render contents()}
			</aside>
		</div>
	{:else}
		<dialog
			class="fixed inset-[auto_0_0] m-0 box-border h-[75dvh] max-h-none w-full max-w-none min-w-0 overflow-auto overscroll-contain border-0 border-none bg-[var(--surface,#fff)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] wrap-anywhere text-[var(--ink,#16161a)] [border-block-start:2px_solid_var(--ink,#16161a)] backdrop:bg-[rgb(0_0_0/35%)]"
			{id}
			lang={locale}
			aria-label={assistantCopy[locale].trace}
			bind:this={sheet}
			oncancel={(event) => {
				event.preventDefault();
				close();
			}}
		>
			{@render contents()}
		</dialog>
	{/if}
{/if}
