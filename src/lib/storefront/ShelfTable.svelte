<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { addCartItem } from './cart';
	import { resolve } from '$app/paths';
	import { specs, type Locale, type Product, type SpecKey } from '../catalog';
	import AddToCart from './AddToCart.svelte';
	import ProductEvidence from './ProductEvidence.svelte';
	import type { ShopperPlan } from '../personalization';
	import FactValue from './FactValue.svelte';

	let {
		products,
		locale,
		onDeal,
		onAdd,
		listingHref,
		reasons,
		highlightedSpecs = [],
		interviewDetails = []
	}: {
		products: readonly Product[];
		locale: Locale;
		listingHref?: (productId: string) => string;
		reasons?: Snippet<[string]>;
		onDeal: (productId: string, locale: Locale) => void;
		onAdd?: (
			id: string
		) =>
			ReturnType<typeof addCartItem>['status'] | Promise<ReturnType<typeof addCartItem>['status']>;
		highlightedSpecs?: readonly SpecKey[];
		interviewDetails?: ShopperPlan['details'];
	} = $props();

	const th = $derived(locale === 'th');
	const category = $derived(products[0]?.category);
	const writtenEvidence = $derived(
		interviewDetails.filter((field) => field === 'summary' || field === 'reviews')
	);
	const columns = $derived.by(() => {
		if (!category || !products.every((product) => product.category === category)) return [];
		const definitions = specs[category].filter(({ key }) =>
			products.some((product) => product.specs[key] !== undefined)
		);
		return [
			...highlightedSpecs.flatMap((key) => definitions.filter((spec) => spec.key === key)),
			...definitions.filter(({ key }) => !highlightedSpecs.includes(key))
		];
	});
</script>

{#if products.length}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users can scroll the table container.) -->
	<div
		class="table-scroll max-w-full overflow-x-auto"
		role="region"
		aria-label={th ? 'ตารางสินค้า' : 'Product table'}
		tabindex="0"
	>
		<table class="w-full border-collapse text-start">
			<thead>
				<tr>
					<th
						class="border-b-2 border-b-[var(--ink)] px-[0.55rem] py-[0.4rem] align-baseline text-start"
						scope="col">{th ? 'สินค้า' : 'Product'}</th>
					{#each columns as column (column.key)}
						<th
							class="figure border-b-2 border-b-[var(--ink)] px-[0.55rem] py-[0.4rem] text-end whitespace-nowrap align-baseline"
							scope="col">{column.label[locale]}</th>
					{:else}
						<th
							class="border-b-2 border-b-[var(--ink)] px-[0.55rem] py-[0.4rem] align-baseline text-start"
							scope="col">{th ? 'สเปก' : 'Specifications'}</th>
					{/each}
					<th
						class="figure border-b-2 border-b-[var(--ink)] px-[0.55rem] py-[0.4rem] text-end whitespace-nowrap align-baseline"
						scope="col">{th ? 'ราคา' : 'Price'}</th>
					<th
						class="figure border-b-2 border-b-[var(--ink)] px-[0.55rem] py-[0.4rem] text-end whitespace-nowrap align-baseline"
						scope="col">{th ? 'คะแนน' : 'Rating'}</th>
					<th
						class="border-b-2 border-b-[var(--ink)] px-[0.55rem] py-[0.4rem] align-baseline text-start"
						scope="col">{onAdd ? (th ? 'ตัวเลือก' : 'Actions') : th ? 'ดีล' : 'Deal'}</th>
				</tr>
			</thead>
			<tbody>
				{#each products as product (product.id)}
					<tr data-product={product.id}>
						<th
							class="border-b border-[var(--seam)] px-[0.55rem] py-[0.4rem] align-baseline text-start"
							scope="row"
						>
							<!-- eslint-disable svelte/no-navigation-without-resolve -- The caller's resolved URL preserves the active look and theme. -->
							<a
								class="inline-flex min-h-[var(--tap,44px)] min-w-32 items-center text-inherit underline underline-offset-[0.18em]"
								href={listingHref?.(product.id) ??
									resolve(`/product/[id]?lang=${locale}&view=receipt`, { id: product.id })}
							>
								<FactValue productId={product.id} field="name" {locale} />
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
							{#if writtenEvidence.length}
								<ProductEvidence productId={product.id} {locale} details={writtenEvidence} />
							{/if}
							{@render reasons?.(product.id)}
						</th>
						{#each columns as column (column.key)}
							<td
								class="figure border-b border-[var(--seam)] px-[0.55rem] py-[0.4rem] text-end whitespace-nowrap align-baseline tabular-nums [font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace]"
							>
								<FactValue productId={product.id} field={`spec.${column.key}`} {locale} />
							</td>
						{:else}
							<td class="border-b border-[var(--seam)] px-[0.55rem] py-[0.4rem] align-baseline">
								<dl class="m-0">
									{#each specs[product.category] as spec (spec.key)}
										{#if product.specs[spec.key] !== undefined}
											<div class="flex flex-wrap gap-x-[0.4rem] gap-y-0">
												<dt class="text-[var(--muted)]">{spec.label[locale]}</dt>
												<dd
													class="m-0 text-end tabular-nums [font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace]"
												>
													<FactValue productId={product.id} field={`spec.${spec.key}`} {locale} />
												</dd>
											</div>
										{/if}
									{/each}
								</dl>
							</td>
						{/each}
						<td
							class="figure border-b border-[var(--seam)] px-[0.55rem] py-[0.4rem] text-end whitespace-nowrap align-baseline tabular-nums [font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace]"
						><FactValue productId={product.id} field="price" {locale} /></td>
						<td
							class="figure border-b border-[var(--seam)] px-[0.55rem] py-[0.4rem] text-end whitespace-nowrap align-baseline tabular-nums [font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace]"
						><FactValue productId={product.id} field="rating" {locale} /></td>
						<td class="border-b border-[var(--seam)] px-[0.55rem] py-[0.4rem] align-baseline">
							{#if onAdd}<AddToCart productId={product.id} {locale} {onAdd} />{/if}
							<button
								class="inline-flex min-h-[var(--tap,44px)] cursor-pointer items-center whitespace-nowrap text-inherit underline underline-offset-[0.18em]"
								type="button"
								onclick={() => onDeal(product.id, locale)}
							>
								{th ? 'ราคาดีที่สุด' : 'Best price'}
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<p>{th ? 'ไม่พบสินค้าที่ตรงกับการค้นหา' : 'No products match this search.'}</p>
{/if}

