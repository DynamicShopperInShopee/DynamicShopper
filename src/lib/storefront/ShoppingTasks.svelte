<script lang="ts">
	import { resolve } from '$app/paths';
	import { getProduct, resolveFact, specs, type Locale } from '../catalog';
	import { getStoreSession } from './store.svelte';
	import { quoteBasket } from './quoteBasket';
	import CatalogPicker from './CatalogPicker.svelte';
	import FactValue from './FactValue.svelte';
	import FactsReceipt from './FactsReceipt.svelte';
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
	let settledDealId = $state('');
	let dealRequest = 0;
	let showing = $state(false);
	let catalogRoot = $state<HTMLDivElement>();
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
		mode === 'deal' && dealId === settledDealId && ids.includes(dealId)
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
	async function chooseDeal(id: string) {
		dealId = id;
		settledDealId = '';
		const request = ++dealRequest;
		await session.cartSettled();
		if (request === dealRequest && dialog.open && ids.includes(id)) settledDealId = id;
	}
	function open(next: typeof mode, trigger: HTMLButtonElement) {
		mode = next;
		showing = true;
		trigger.focus({ preventScroll: true });
		dialog.showModal();
		if (next === 'deal' && dealId) void chooseDeal(dealId);
	}
</script>

<div class="actions" class:strip role="group" aria-label={th ? 'เครื่องมือเลือกซื้อ' : 'Shopping tasks'}>
	<button
		type="button"
		{disabled}
		aria-haspopup="dialog"
		onclick={(e) => open('compare', e.currentTarget)}
	>
		{th ? 'เปรียบเทียบสินค้า' : 'Compare products'}
	</button>
	<button
		type="button"
		{disabled}
		aria-haspopup="dialog"
		onclick={(e) => open('deal', e.currentTarget)}
	>
		{th ? 'คำนวณดีล' : 'Calculate a deal'}
	</button>
	{#if publicEntry}<a href={resolve('/?view=receipt#criteria-overview')}>
			{th ? 'แก้ไขเกณฑ์' : 'Edit criteria'}
		</a>{/if}
</div>
<dialog bind:this={dialog} onclose={() => (showing = false)} aria-labelledby="shopping-task-title">
	<header>
		<h2 id="shopping-task-title">
			{mode === 'deal'
				? th
					? 'คำนวณดีล'
					: 'Calculate a deal'
				: th
					? 'เปรียบเทียบสินค้า'
					: 'Compare products'}
		</h2>
		<button type="button" onclick={() => dialog.close()}>{th ? 'ปิด' : 'Close'}</button>
	</header>
	{#if showing}
		<FactsReceipt root={catalogRoot} {locale} />
		<div bind:this={catalogRoot}>
			{#if mode === 'deal'}
				<CatalogPicker
					{ids}
					{locale}
					label={th ? 'สินค้าที่ต้องการคำนวณ' : 'Choose a product'}
					bind:selected={() => dealId, chooseDeal}
				/>
			{:else}
				<div class="pickers">
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
					<fieldset>
						<legend>{th ? 'ข้อมูลที่ต้องการเทียบ' : 'Fields to compare'}</legend>
						{#each fields as field (field.key)}
							<label>
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
					<table>
						<caption>{th ? 'สินค้าที่เลือก' : 'Selected products'}</caption>
						<thead>
							<tr>
								<th scope="col">{th ? 'ข้อมูล' : 'Field'}</th>{#each [first, second] as id (id)}<th
										scope="col"
									>
										<FactValue productId={id} field="name" {locale} />
									</th>{/each}
							</tr>
						</thead>
						<tbody>
							{#each fields.filter((field) => !hiddenFields.includes(field.key)) as field (field.key)}
								<tr>
									<th scope="row">{field.label}</th>{#each [first, second] as id (id)}<td>
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
		</div>
		{#if mode === 'deal' && deal}<DealSlip {...deal} />{/if}
		{#if !ids.length}<p>
				{th
					? 'ไม่มีสินค้าตรงตามเกณฑ์ ลองแก้ไขตัวกรองเพื่อดูสินค้าเพิ่มเติม'
					: 'No products match. Edit your filters to see more products.'}
			</p>{/if}
	{/if}
</dialog>

<style>
	.actions,
	header,
	fieldset {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}
	.actions {
		margin-block: 0.4rem 0.75rem;
	}
	button {
		color: inherit;
		background: var(--paper, white);
		border: 1px solid var(--seam, currentColor);
		padding: 0.45em 0.8em;
		font: inherit;
		min-height: max(44px, 2.5em);
		cursor: pointer;
	}
	.strip {
		flex-wrap: nowrap;
		margin: 0;
		white-space: nowrap;
	}
	.actions a {
		display: inline-flex;
		align-items: center;
		min-height: max(44px, 2.5em);
		color: inherit;
		text-underline-offset: 0.18em;
	}
	dialog {
		color: var(--ink, #17201f);
		background: var(--paper, white);
		border: 1px solid currentColor;
		padding: 1rem;
		width: min(44rem, calc(100% - 1.5rem));
		max-height: 85dvh;
		overflow: auto;
	}
	dialog::backdrop {
		background: rgb(20 22 24 / 55%);
	}
	header {
		justify-content: space-between;
		border-bottom: 1px solid currentColor;
		margin-bottom: 0.8rem;
		padding-bottom: 0.55rem;
	}
	h2 {
		font-size: 1.2em;
		margin: 0;
	}
	.pickers {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.65rem;
	}
	fieldset {
		border: 0;
		border-top: 1px solid var(--seam);
		margin: 0.8rem 0;
		padding: 0.3rem 0;
	}
	fieldset label {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		min-height: max(44px, 2.5em);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}
	caption {
		text-align: start;
		font-weight: 600;
	}
	th,
	td {
		overflow-wrap: anywhere;
		text-align: start;
		vertical-align: top;
		border-bottom: 1px solid var(--seam);
		padding: 0.45rem 0.2rem;
	}
	@media (max-width: 40rem) {
		.pickers {
			grid-template-columns: 1fr;
		}
	}
</style>
