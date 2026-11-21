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

<dialog
	class="fixed inset-[auto_0_0] mx-auto my-0 box-border max-h-[88dvh] w-full max-w-full border-0 border-none bg-[var(--paper)] p-0 text-[var(--ink)] [border-top:2px_solid_var(--ink)] backdrop:bg-[#16161a66] open:grid open:grid-rows-[auto_minmax(0,1fr)] min-[701px]:inset-0 min-[701px]:m-auto min-[701px]:h-fit min-[701px]:w-[min(36rem,calc(100%-3rem))] min-[701px]:rounded-[var(--radius)] min-[701px]:border min-[701px]:border-t-2 min-[701px]:border-solid min-[701px]:border-[var(--ink)]"
	use:show
	oncancel={onclose}
	aria-labelledby="interview-dialog-title"
>
	<header
		class="flex items-center justify-between gap-3 p-[0.375rem_0.75rem_0.375rem_1.125rem] [border-bottom:1px_solid_var(--seam)]"
	>
		<h2 class="m-0 text-[length:var(--size)] font-semibold" id="interview-dialog-title">{title}</h2>
		<button
			class="grid min-h-[var(--tap)] min-w-[var(--tap)] cursor-pointer place-items-center border-0 border-none bg-transparent text-[var(--ink)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]"
			type="button"
			onclick={onclose}
			aria-label={closeLabel}
		>
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
	<div class="content min-h-0 overflow-auto overscroll-contain">{@render children()}</div>
</dialog>
