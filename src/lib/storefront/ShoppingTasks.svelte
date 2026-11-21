<script lang="ts">
	import { resolve } from '$app/paths';
	import { getProduct, resolveFact, specs, type Locale } from '../catalog';
	import { getStoreSession } from './store.svelte';
	import { quoteBasket } from './quoteBasket';
	import CatalogPicker from './CatalogPicker.svelte';
	import FactValue from './FactValue.svelte';
	import DealSlip from './DealSlip.svelte';

	let {
		locale,
		ids,
		disabled,
		publicEntry = false,
		strip = false
	}: {
		locale: Locale;
		ids: string[];
		publicEntry?: boolean;
		strip?: boolean;
		disabled: boolean;
	} = $props();
	const session = getStoreSession();
	const th = $derived(locale === 'th');
	let dialog: HTMLDialogElement;
	let mode = $state<'compare' | 'deal'>('compare');
	let dealId = $state('');
	let showing = $state(false);
	const first = $derived(session.compareCandidates.first);
	const second = $derived(session.compareCandidates.second);
	let hiddenFields = $state<string[]>([]);
	const firstProduct = $derived(getProduct(first));
	const secondProduct = $derived(getProduct(second));
	const fields = $derived([
		{ key: 'price', label: th ? 'ราคา' : 'Price' },
		{ key: 'shipping', label: th ? 'ค่าจัดส่ง' : 'Shipping' },
		{ key: 'rating', label: th ? 'คะแนน' : 'Rating' },
		...(firstProduct && firstProduct.category === secondProduct?.category
			? specs[firstProduct.category].map((spec) => ({
					key: 'spec.' + spec.key,
					label: spec.label[locale]
				}))
			: [])
	]);
	const deal = $derived(
		mode === 'deal' && ids.includes(dealId)
			? quoteBasket(
					[
						{
							productId: dealId,
							quantity: session.cart.find((item) => item.productId === dealId)?.quantity ?? 1
						}
					],
					locale,
					session.clock.context
				)
			: undefined
	);
	function open(next: typeof mode, trigger: HTMLButtonElement) {
		mode = next;
		showing = true;
		trigger.focus({ preventScroll: true });
		dialog.showModal();
	}
</script>

<div
	class={[
		'actions mt-[0.4rem] mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 [&.strip]:m-0 [&.strip]:flex-nowrap [&.strip]:whitespace-nowrap'
	]}
	class:strip
	role="group"
	aria-label={th ? 'เครื่องมือเลือกซื้อ' : 'Shopping tasks'}
>
	<button
		class="min-h-[max(44px,2.5em)] cursor-pointer border border-[var(--seam,currentColor)] bg-[var(--paper,white)] px-[0.8em] py-[0.45em] text-inherit"
		type="button"
		{disabled}
		aria-haspopup="dialog"
		onclick={(e) => open('compare', e.currentTarget)}
	>
		{th ? 'เปรียบเทียบสินค้า' : 'Compare products'}
	</button>
	<button
		class="min-h-[max(44px,2.5em)] cursor-pointer border border-[var(--seam,currentColor)] bg-[var(--paper,white)] px-[0.8em] py-[0.45em] text-inherit"
		type="button"
		{disabled}
		aria-haspopup="dialog"
		onclick={(e) => open('deal', e.currentTarget)}
	>
		{th ? 'คำนวณดีล' : 'Calculate a deal'}
	</button>
	{#if publicEntry}<a
			class="inline-flex min-h-[max(44px,2.5em)] items-center text-inherit underline-offset-[0.18em]"
			href={resolve('/?view=receipt#criteria-overview')}
		>
			{th ? 'แก้ไขเกณฑ์' : 'Edit criteria'}
		</a>{/if}
</div>
<dialog
	class="max-h-[85dvh] w-[min(44rem,calc(100%-1.5rem))] overflow-auto border border-current bg-[var(--paper,white)] p-4 text-[var(--ink,#17201f)] backdrop:bg-[rgb(20_22_24/55%)]"
	bind:this={dialog}
	onclose={() => (showing = false)}
	aria-labelledby="shopping-task-title"
>
	<header
		class="mb-[0.8rem] flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-[0.55rem] [border-bottom:1px_solid_currentColor]"
	>
		<h2 class="m-0 text-[1.2em]" id="shopping-task-title">
			{mode === 'deal'
				? th
					? 'คำนวณดีล'
					: 'Calculate a deal'
				: th
					? 'เปรียบเทียบสินค้า'
					: 'Compare products'}
		</h2>
		<button
			class="min-h-[max(44px,2.5em)] cursor-pointer border border-[var(--seam,currentColor)] bg-[var(--paper,white)] px-[0.8em] py-[0.45em] text-inherit"
			type="button"
			onclick={() => dialog.close()}
		>
			{th ? 'ปิด' : 'Close'}
		</button>
	</header>
	{#if showing}
		{#if mode === 'deal'}
			<CatalogPicker
				{ids}
				{locale}
				label={th ? 'สินค้าที่ต้องการคำนวณ' : 'Choose a product'}
				bind:selected={dealId}
			/>
			{#if deal}<DealSlip {...deal} />{/if}
		{:else}
			<div class="pickers grid grid-cols-2 gap-[0.65rem] [@media(max-width:40rem)]:grid-cols-[1fr]">
				<div>
					<CatalogPicker
						{ids}
						{locale}
						label={th ? 'สินค้าชิ้นแรก' : 'First product'}
						bind:selected={session.compareCandidates.first}
						omit={second}
					/>
				</div>
				<div>
					<CatalogPicker
						{ids}
						{locale}
						label={th ? 'สินค้าชิ้นที่สอง' : 'Second product'}
						bind:selected={session.compareCandidates.second}
						omit={first}
					/>
				</div>
			</div>
			{#if firstProduct && secondProduct}
				<fieldset
					class="mx-0 my-[0.8rem] flex flex-wrap items-center gap-x-4 gap-y-2 border-0 border-none px-0 py-[0.3rem] [border-top:1px_solid_var(--seam)]"
				>
					<legend>{th ? 'ข้อมูลที่ต้องการเทียบ' : 'Fields to compare'}</legend>
					{#each fields as field (field.key)}
						<label class="inline-flex min-h-[max(44px,2.5em)] items-center gap-[0.25em]">
							<input
								type="checkbox"
								checked={!hiddenFields.includes(field.key)}
								onchange={(e) => {
									hiddenFields = e.currentTarget.checked
										? hiddenFields.filter((key) => key !== field.key)
										: [...hiddenFields, field.key];
								}}
							/>{field.label}
						</label>
					{/each}
				</fieldset>
				<table class="w-full table-fixed border-collapse">
					<caption class="text-start font-semibold">
						{th ? 'สินค้าที่เลือก' : 'Selected products'}
					</caption>
					<thead>
						<tr>
							<th
								class="px-[0.2rem] py-[0.45rem] text-start align-top wrap-anywhere [border-bottom:1px_solid_var(--seam)]"
								scope="col"
							>
								{th ? 'ข้อมูล' : 'Field'}
							</th>{#each [first, second] as id (id)}<th
									class="px-[0.2rem] py-[0.45rem] text-start align-top wrap-anywhere [border-bottom:1px_solid_var(--seam)]"
									scope="col"
								>
									<FactValue productId={id} field="name" {locale} />
								</th>{/each}
						</tr>
					</thead>
					<tbody>
						{#each fields.filter((field) => !hiddenFields.includes(field.key)) as field (field.key)}
							<tr>
								<th
									class="px-[0.2rem] py-[0.45rem] text-start align-top wrap-anywhere [border-bottom:1px_solid_var(--seam)]"
									scope="row"
								>
									{field.label}
								</th>{#each [first, second] as id (id)}<td
										class="px-[0.2rem] py-[0.45rem] text-start align-top wrap-anywhere [border-bottom:1px_solid_var(--seam)]"
									>
										{#if resolveFact(id, field.key)}<FactValue
												productId={id}
												field={field.key}
												{locale}
											/>{:else}{th ? 'ไม่มีข้อมูลในรายการ' : 'Not listed'}{/if}
									</td>{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		{/if}
		{#if !ids.length}<p>
				{th
					? 'ไม่มีสินค้าตรงตามเกณฑ์ ลองแก้ไขตัวกรองเพื่อดูสินค้าเพิ่มเติม'
					: 'No products match. Edit your filters to see more products.'}
			</p>{/if}
	{/if}
</dialog>
