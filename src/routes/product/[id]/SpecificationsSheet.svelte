<script lang="ts">
	import type { PageData } from './$types';

	let {
		specs,
		th,
		sheet = $bindable()
	}: { specs: PageData['specs']; th: boolean; sheet?: HTMLDialogElement } = $props();
</script>

<nav class="actions" aria-label={th ? 'การทำงานกับสินค้า' : 'Product actions'}>
	<a href="#reviews">
		<svg
			aria-hidden="true"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<path d="M20 11a8 8 0 0 1-8 8H5l2-3a8 8 0 1 1 13-5Z" /><path d="M9 11h6" />
		</svg>
		{th ? 'รีวิว' : 'Reviews'}
	</a>

	<a href="#details">
		<svg
			aria-hidden="true"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<path d="M6 3h12v18H6zM9 8h6m-6 4h6m-6 4h4" />
		</svg>
		{th ? 'รายละเอียด' : 'Details'}
	</a>
	{#if specs.length}
		<button
			type="button"
			aria-controls="product-specifications"
			aria-haspopup="dialog"
			onclick={(event) => {
				event.currentTarget.focus({ preventScroll: true });
				sheet?.showModal();
			}}
		>
			{th ? 'สเปกสินค้า' : 'Specifications'}
		</button>
	{/if}
</nav>
{#if specs.length}
	<dialog id="product-specifications" bind:this={sheet} aria-labelledby="specs-title">
		<h2 id="specs-title">{th ? 'สเปกสินค้า' : 'Specifications'}</h2>
		<div class="sheet-content">
			<dl>
				{#each specs as spec (spec.attributes['data-fact'])}
					<div>
						<dt>{spec.label}</dt>
						<dd {...spec.attributes}>{spec.text}</dd>
					</div>
				{/each}
			</dl>
		</div>
		<form method="dialog"><button>{th ? 'ตกลง' : 'Done'}</button></form>
	</dialog>
{/if}

<style>
	.actions {
		position: sticky;
		display: flex;
		gap: 0;
		align-items: stretch;
		bottom: 0;
		border-top: 1px solid #e9e6dc;
		background: white;
		padding-bottom: env(safe-area-inset-bottom);
	}
	.actions button {
		flex: 2;
		width: auto;
		border-radius: 0;
	}
	.actions a {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		border-inline-end: 1px solid #e9e6dc;
		min-height: 48px;
		padding: 0 0.4rem;
		color: inherit;
		text-align: center;
		text-decoration: none;
		font-size: max(0.75rem, var(--action-font-floor, 0rem));
	}
	button {
		font: inherit;
		width: 100%;
		min-height: 48px;
		color: white;
		background: #16161a;
		border: 1px solid #16161a;
		border-radius: 4px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid #16161a;
		outline-offset: 2px;
	}
	dialog {
		width: min(100%, 36rem);
		max-width: 100%;
		max-height: 85dvh;
		box-sizing: border-box;
		margin: auto auto 0;
		border: 1px solid #e9e6dc;
		border-radius: 12px 12px 0 0;
		padding: 0;
		color: #16161a;
	}
	dialog[open] {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.sheet-content {
		flex: 1 1 auto;
		min-height: 0;
		overflow: auto;
		overscroll-behavior: contain;
		padding-inline: 1.25rem;
	}
	dialog form {
		flex: none;
		border-top: 1px solid #e9e6dc;
		padding: 0.5rem 0.5rem max(0.5rem, env(safe-area-inset-bottom, 0px));
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}
	h2 {
		text-align: center;
		margin: 0;
		padding: 0.85rem 1rem;
		font-size: max(1.125rem, var(--action-font-floor, 0rem));
		border-bottom: 1px solid #e9e6dc;
	}
	@media (max-width: 699px) {
		dialog {
			height: 84dvh;
		}
		.actions {
			position: fixed;
			inset-inline: 0;
			z-index: 2;
			min-height: 50px;
		}
	}
	@media (min-width: 700px) {
		dialog {
			margin: auto;
			border-radius: 8px;
		}
	}
	dl div {
		display: grid;
		grid-template-columns: minmax(0, 36%) minmax(0, 1fr);
		gap: 0.75rem;
		padding: 0.65rem 0;
	}
	dt {
		color: #5d5d63;
	}
	dd {
		margin: 0;
		overflow-wrap: anywhere;
		font-family: var(--product-figure-font);
	}
</style>
