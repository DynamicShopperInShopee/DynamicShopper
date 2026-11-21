<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Locale, Product } from '../catalog';
	import { personaPlan, rankProducts, type ShopperPlan } from '../personalization';
	import FactsReceipt from './FactsReceipt.svelte';
	import FactValue from './FactValue.svelte';
	import ShelfTable from './ShelfTable.svelte';

	let {
		plan,
		locale,
		eligibleProducts,
		onDeal
	}: {
		plan: ShopperPlan;
		locale: Locale;
		eligibleProducts: readonly Product[];
		onDeal: (productId: string, locale: Locale) => void;
	} = $props();

	let panes = $state<HTMLElement>();
	const search = $derived({
		query: plan.query,
		category: plan.category,
		maxPrice: plan.maxPrice,
		shops: plan.shops,
		mallOnly: plan.mallOnly
	});
	const tech = $derived(
		rankProducts(eligibleProducts, { ...personaPlan('tech'), ...search }).map(
			({ product }) => product
		)
	);
	const mom = $derived(
		rankProducts(eligibleProducts, { ...personaPlan('mom'), ...search }).map(
			({ product }) => product
		)
	);
</script>

<section aria-label={locale === 'th' ? 'เปรียบเทียบหน้าร้าน' : 'Compare views'}>
	<div
		class="panes grid gap-4 min-[1024px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
		bind:this={panes}
	>
		<section
			class="pane tech min-w-0 border border-[var(--seam)] bg-white p-[0.85rem] text-[1rem] text-[var(--ink)] [--ink:#16161a] [--muted:#5d5d63] [--seam:#ecebe6] [--tap:44px]"
			data-compare-pane
			lang="en"
			aria-label="Tech shopper"
		>
			<h2 class="mx-0 mt-0 mb-[0.65rem] font-semibold [border-bottom:2px_solid_var(--ink)]">
				Tech shopper
			</h2>
			<ShelfTable products={tech} locale="en" {onDeal} />
		</section>
		<section
			class="pane mom min-w-0 border border-[var(--seam)] bg-[#fbfbf8] p-[0.85rem] text-[1.25rem] text-[var(--ink)] [--ink:#0d0d10] [--muted:#3d3d42] [--seam:#858172]"
			data-compare-pane
			lang="th"
			aria-label="โหมดคุณแม่"
		>
			<h2 class="mx-0 mt-0 mb-[0.65rem] font-semibold [border-bottom:2px_solid_var(--ink)]">
				โหมดคุณแม่
			</h2>
			{#if mom.length}
				<ul class="m-0 list-none p-0">
					{#each mom as product (product.id)}
						<li
							class={[
								'px-0 py-[0.65rem] [border-bottom:1px_solid_var(--seam)] last:[border-bottom:0] [&_>_p]:mx-0 [&_>_p]:mt-0 [&_>_p]:mb-[0.55rem]'
							]}
							data-product={product.id}
						>
							<a
								class="inline-flex min-h-12 items-center font-semibold text-inherit underline underline-offset-[0.18em]"
								href={resolve(`/product/[id]?lang=th&theme=large&view=receipt`, { id: product.id })}
							>
								<FactValue productId={product.id} field="name" locale="th" />
							</a>
							<FactValue productId={product.id} field="summary" locale="th" tag="p" />
							<dl class="m-0 list-none p-0">
								<div class="flex flex-wrap justify-between gap-x-3 gap-y-0">
									<dt class="text-[var(--muted)]">ราคา</dt>
									<dd
										class="m-0 list-none p-0 font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
									>
										<FactValue productId={product.id} field="price" locale="th" />
									</dd>
								</div>
								<div class="flex flex-wrap justify-between gap-x-3 gap-y-0">
									<dt class="text-[var(--muted)]">ค่าจัดส่ง</dt>
									<dd
										class="m-0 list-none p-0 font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
									>
										<FactValue productId={product.id} field="shipping" locale="th" />
									</dd>
								</div>
							</dl>
							<button
								class="mt-[0.55rem] inline-flex min-h-12 cursor-pointer items-center rounded-[6px] border border-[var(--seam)] bg-white px-[0.7rem] text-inherit hover:border-[var(--ink)]"
								type="button"
								onclick={() => onDeal(product.id, 'th')}
							>
								ราคาดีที่สุด
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p>ไม่พบสินค้าที่ตรงกับการค้นหา</p>
			{/if}
		</section>
	</div>
	<FactsReceipt root={panes} {locale} compare={true} />
</section>
