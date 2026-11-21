<script lang="ts">
	import type { Snippet } from 'svelte';
	let { title, onclose, children }: { title: string; onclose: () => void; children: Snippet } =
		$props();
	function show(node: HTMLDialogElement) {
		const prior = document.activeElement as HTMLElement;
		node.showModal();
		return {
			destroy() {
				node.close();
				prior?.focus();
			}
		};
	}
</script>

<dialog use:show oncancel={onclose} aria-label={title}>
	<header>
		<h2>{title}</h2>
		<button onclick={onclose} aria-label="Close / ปิด">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
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
		width: min(100%, 480px);
		max-height: 88dvh;
		padding: 0;
		border: 1px solid var(--ink);
		border-top: 2px solid var(--ink);
		background: var(--paper);
		color: var(--ink);
		border-radius: 16px 16px 0 0;
	}
	dialog::backdrop {
		background: #16161a66;
	}
	header {
		position: sticky;
		top: 0;
		background: var(--paper);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--line);
		z-index: 1;
	}
	h2 {
		font-size: 20px;
		margin: 0;
	}
	button {
		display: grid;
		place-items: center;
		min-height: 48px;
		min-width: 48px;
		background: transparent;
		border: 0;
		color: inherit;
		cursor: pointer;
	}
	.content {
		padding: 20px 20px calc(28px + env(safe-area-inset-bottom));
	}
	@media (min-width: 701px) {
		dialog {
			inset: 50% auto auto 50%;
			transform: translate(-50%, -50%);
			margin: 0;
			width: min(560px, calc(100% - 48px));
			border-radius: 8px;
		}
	}
</style>
