<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let {
		data,
		th,
		sheet = $bindable()
	}: { data: PageData; th: boolean; sheet?: HTMLDialogElement } = $props();
	const rows = $derived.by(() => {
		const details = data.listingDetails;
		const all = [
			{ label: th ? 'สินค้า' : 'Product', ...data.name },
			...(data.shop ? [{ label: th ? 'ร้านค้า' : 'Seller', ...data.shop }] : []),
			...data.specs,
			...(details ? [...details.technical, ...details.dimensions, ...details.features] : []),
			{ label: th ? 'เกี่ยวกับสินค้า' : 'About this item', ...data.summary }
		];
		return [...new Map(all.map((row) => [row.attributes['data-fact'], row])).values()];
	});
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
</script>

<nav
	class={[
		'actions sticky bottom-0 grid grid-cols-2 items-stretch gap-0 border-t border-[#e9e6dc] bg-white pb-[env(safe-area-inset-bottom)] [&.has-specs]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] [@media(max-width:699px)]:fixed [@media(max-width:699px)]:inset-x-0 [@media(max-width:699px)]:z-2 [@media(max-width:699px)]:min-h-[50px]'
	]}
	class:has-specs={data.specs.length > 0}
	aria-label={th ? 'การทำงานกับสินค้า' : 'Product actions'}
>
	<a
		class="flex min-h-12 flex-1 flex-col items-center justify-center border-e border-[#e9e6dc] px-0.5 text-center text-[max(0.75rem,var(--action-font-floor,0rem))] text-inherit no-underline"
		href="#reviews"
	>
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

	<a
		class="flex min-h-12 flex-1 flex-col items-center justify-center border-e border-[#e9e6dc] px-0.5 text-center text-[max(0.75rem,var(--action-font-floor,0rem))] text-inherit no-underline"
		href="#details"
	>
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
	{#if data.specs.length}
		<button
			class="min-h-12 w-full cursor-pointer rounded-none border border-[#16161a] bg-[#16161a] text-white [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16161a] focus-visible:outline-solid"
			type="button"
			disabled={!ready}
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
{#if data.specs.length}
	<dialog
		class="mx-auto mt-auto mb-0 box-border max-h-[85dvh] w-[min(100%,36rem)] max-w-full rounded-t-[12px] border border-[#e9e6dc] p-0 text-[#16161a] backdrop:bg-[rgb(0_0_0/40%)] open:flex open:flex-col open:overflow-hidden min-[700px]:mb-auto min-[700px]:rounded-lg [@media(max-width:699px)]:h-[84dvh]"
		id="product-specifications"
		bind:this={sheet}
		aria-labelledby="specs-title"
	>
		<h2
			class="m-0 border-b border-[#e9e6dc] px-4 py-[0.85rem] text-center text-[max(1.125rem,var(--action-font-floor,0rem))]"
			id="specs-title"
		>
			{th ? 'สเปกสินค้า' : 'Specifications'}
		</h2>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll the attribute region.) -->
		<div
			class="sheet-content min-h-0 flex-auto overflow-auto overscroll-contain px-5 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-current focus-visible:outline-solid"
			tabindex="0"
			role="region"
			aria-label={th ? 'คุณลักษณะสินค้า' : 'Product attributes'}
		>
			<dl class="specifications-list">
				{#each rows as spec (spec.attributes['data-fact'])}
					<div class="grid grid-cols-[minmax(0,38%)_minmax(0,1fr)] gap-3 py-[0.65rem]">
						<dt class="text-[#5d5d63]">{spec.label}</dt>
						<dd
							class={['m-0 wrap-anywhere [&.figure]:font-[family-name:var(--product-figure-font)]']}
							class:figure={Number.isFinite(Number(spec.attributes['data-raw'])) ||
								spec.attributes['data-fact'] === 'detail.voltage'}
							{...spec.attributes}
						>
							{spec.text}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
		<form
			class="flex-none border-t border-[#e9e6dc] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
			method="dialog"
		>
			<button
				class="min-h-12 w-full cursor-pointer rounded border border-[#16161a] bg-[#16161a] text-white [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16161a] focus-visible:outline-solid"
			>
				{th ? 'ตกลง' : 'Done'}
			</button>
		</form>
	</dialog>
{/if}
