<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		title,
		closeLabel,
		onclose,
		children
	}: {
		title: string;
		closeLabel: string;
		onclose: () => void;
		children: Snippet;
	} = $props();
	function show(node: HTMLDialogElement) {
		const trigger = document.activeElement;
		node.showModal();
		node.querySelector<HTMLElement>('#interview-step-title')?.focus({ preventScroll: true });
		return {
			destroy() {
				node.close();
				if (trigger instanceof HTMLElement && trigger.isConnected)
					trigger.focus({ preventScroll: true });
			}
		};
	}
</script>

<dialog use:show oncancel={onclose} aria-labelledby="interview-dialog-title">
	<header>
		<h2 id="interview-dialog-title">{title}</h2>
		<button type="button" onclick={onclose} aria-label={closeLabel}>
			<svg
				aria-hidden="true"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
			>
				<path d="m6 6 12 12M18 6 6 18" />
			</svg>
		</button>
	</header>
	<div class="content">{@render children()}</div>
</dialog>

<style>
	dialog {
		box-sizing: border-box;
		position: fixed;
		inset: auto 0 0;
		margin: 0 auto;
		width: 100%;
		max-width: 100%;
		max-height: 88dvh;
		padding: 0;
		border: 0;
		border-top: 2px solid var(--ink);
		background: var(--paper);
		color: var(--ink);
	}
	dialog[open] {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
	}
	dialog::backdrop {
		background: #16161a66;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.375rem 0.75rem 0.375rem 1.125rem;
		border-bottom: 1px solid var(--seam);
	}
	h2 {
		font-size: var(--size);
		font-weight: 600;
		margin: 0;
	}
	button {
		display: grid;
		place-items: center;
		min-height: var(--tap);
		min-width: var(--tap);
		background: transparent;
		border: 0;
		color: var(--ink);
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	.content {
		min-block-size: 0;
		overflow: auto;
		overscroll-behavior: contain;
	}
	@media (min-width: 701px) {
		dialog {
			inset: 0;
			margin: auto;
			width: min(36rem, calc(100% - 3rem));
			height: fit-content;
			border: 1px solid var(--ink);
			border-top-width: 2px;
			border-radius: var(--radius);
		}
	}
</style>
