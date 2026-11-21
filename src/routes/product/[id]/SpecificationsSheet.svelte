<script lang="ts">
	import SpecificationRows from './SpecificationRows.svelte';

	let {
		specs,
		th,
		hasReview
	}: { specs: readonly [number, number, number, number]; th: boolean; hasReview: boolean } =
		$props();
	let sheet = $state<HTMLDialogElement>();
</script>

<nav class="actions" aria-label={th ? 'การทำงานกับสินค้า' : 'Product actions'}>
	{#if hasReview}
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
	{/if}
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
	<button type="button" aria-haspopup="dialog" onclick={() => sheet?.showModal()}>
		{th ? 'สเปกสินค้า' : 'Specifications'}
	</button>
</nav>

<dialog bind:this={sheet} aria-labelledby="specs-title">
	<h2 id="specs-title">{th ? 'สเปกสินค้า' : 'Specifications'}</h2>
	<SpecificationRows {specs} {th} />
	<form method="dialog"><button>{th ? 'ตกลง' : 'Done'}</button></form>
</dialog>

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
		font-size: 0.75rem;
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
		padding: 1rem;
		color: #16161a;
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}
	h2 {
		text-align: center;
		margin: 0;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e9e6dc;
	}
	@media (max-width: 699px) {
		.actions {
			position: fixed;
			inset-inline: 0;
			z-index: 2;
			min-height: var(--product-actions-height);
		}
	}
	@media (min-width: 700px) {
		dialog {
			margin: auto;
			border-radius: 8px;
		}
	}
</style>
