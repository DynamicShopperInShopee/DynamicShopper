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
	<div class="actions">
		<button type="button" bind:this={closeButton} onclick={close}>
			{locale === 'th' ? 'ปิดการดูขั้นตอน' : 'Close X-ray'}
		</button>
	</div>
	<div class="proof-content">
		{@render children()}
	</div>
{/snippet}

{#if open}
	{#if desktop.current}
		<div class="anchor">
			<aside {id} lang={locale} aria-label={assistantCopy[locale].trace} class="drawer">
				{@render contents()}
			</aside>
		</div>
	{:else}
		<dialog
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

<style>
	.anchor {
		position: sticky;
		inset-block-start: var(--xray-sticky-offset, 0px);
		z-index: 2;
		block-size: 0;
		pointer-events: none;
	}
	.drawer,
	dialog {
		box-sizing: border-box;
		min-inline-size: 0;
		padding: 1rem;
		color: var(--ink, #16161a);
		background: var(--surface, #fff);
		overflow: auto;
		overscroll-behavior: contain;
		overflow-wrap: anywhere;
	}
	.drawer {
		inline-size: min(100%, 320px);
		max-block-size: calc(100dvh - var(--xray-sticky-offset, 0px));
		margin-inline-start: auto;
		border-inline-start: 1px solid var(--ink, #16161a);
		pointer-events: auto;
	}
	dialog {
		position: fixed;
		inset: auto 0 0;
		margin: 0;
		inline-size: 100%;
		block-size: 75dvh;
		max-inline-size: none;
		max-block-size: none;
		padding-block-end: max(1rem, env(safe-area-inset-bottom));
		border: 0;
		border-block-start: 2px solid var(--ink, #16161a);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 35%);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		margin-block-end: 0.5rem;
	}
	.proof-content > :global(section) {
		max-inline-size: none;
		padding: 0;
		border: 0;
	}
	button {
		min-inline-size: var(--tap, 44px);
		min-block-size: var(--tap, 44px);
		padding-inline: 0.75rem;
		border: 1px solid currentColor;
		border-radius: var(--radius, 4px);
		background: var(--surface, #fff);
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: 2px;
	}
</style>
