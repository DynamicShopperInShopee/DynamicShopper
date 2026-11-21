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
	class="icon"
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
	<div class="strip">
		<span>{th ? 'แชร์สินค้านี้' : 'Share this product'}</span>
		<button type="button" onclick={share} aria-busy={busy}>{th ? 'แชร์' : 'Share'}</button>
	</div>
{/if}
<div class="feedback" role="status">{copied ? (th ? 'คัดลอกลิงก์แล้ว' : 'Link copied') : ''}</div>
<dialog bind:this={manual} aria-labelledby="share-dialog-title" onclose={restoreFocus}>
	<h2 id="share-dialog-title">{th ? 'แชร์ลิงก์สินค้า' : 'Share product link'}</h2>
	<label for="share-url">{th ? 'เลือกลิงก์เพื่อคัดลอก' : 'Select the link to copy it'}</label>
	<input
		id="share-url"
		readonly
		type="url"
		bind:this={input}
		value={link}
		onfocus={(e) => e.currentTarget.select()}
	/>
	<form method="dialog"><button>{th ? 'เสร็จสิ้น' : 'Done'}</button></form>
</dialog>

<style>
	button {
		font: inherit;
		cursor: pointer;
		pointer-events: auto;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: -3px;
	}
	.icon {
		flex: 0 0 var(--tap, 44px);
		display: grid;
		place-items: center;
		width: var(--tap, 44px);
		min-height: var(--tap, 44px);
		border-radius: 50%;
		color: var(--accent, #16161a);
		background: transparent;
	}
	.strip {
		display: none;
	}
	.feedback:not(:empty) {
		position: absolute;
		inset-inline-end: 0.75rem;
		top: 100%;
		padding: 0.4rem 0.75rem;
		background: #16161a;
		color: white;
		border-radius: 4px;
		pointer-events: none;
	}
	dialog {
		pointer-events: auto;
		width: min(calc(100% - 2rem), 28rem);
		margin: auto;
		padding: 1.1rem;
		background: white;
		color: #16161a;
		border: 1px solid var(--seam, #e9e6dc);
		border-radius: 8px;
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}
	h2 {
		font: inherit;
		font-weight: 600;
		margin: 0 0 0.75rem;
	}
	input {
		display: block;
		margin: 0.4rem 0 0.85rem;
		width: 100%;
		min-height: var(--tap, 44px);
		border: 1px solid #777;
		padding: 0 0.5rem;
		font: inherit;
	}
	form button {
		display: block;
		width: 100%;
		min-height: var(--tap, 44px);
		color: white;
		background: #16161a;
		border-radius: 4px;
	}
	@media (max-width: 699px) {
		.icon.over-hero {
			background: #27394e;
			color: white;
		}
		.strip {
			position: fixed;
			bottom: var(--listing-actions-height);
			inset-inline: 0;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.5rem;
			height: var(--tap, 44px);
			padding-inline: 0.75rem;
			color: white;
			background: #373737;
			font-size: max(0.875rem, var(--action-font-floor, 0rem));
		}
		.strip button {
			height: 100%;
			min-width: var(--tap, 44px);
			padding-inline: 0.65rem;
			color: inherit;
			text-decoration: underline;
		}
	}
</style>
