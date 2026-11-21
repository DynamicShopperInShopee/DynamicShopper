<script lang="ts">
	import type { addCartItem } from './cart';
	import { resolve } from '$app/paths';
	import { specs, type Locale, type Product, type SpecKey } from '../catalog';
	import AddToCart from './AddToCart.svelte';
	import FactValue from './FactValue.svelte';

	let {
		products,
		locale,
		onDeal,
		onAdd,
		highlightedSpecs = []
	}: {
		products: readonly Product[];
		locale: Locale;
		onDeal: (productId: string, locale: Locale) => void;
		onAdd?: (
			id: string
		) =>
			ReturnType<typeof addCartItem>['status'] | Promise<ReturnType<typeof addCartItem>['status']>;
		highlightedSpecs?: readonly SpecKey[];
	} = $props();

	const th = $derived(locale === 'th');
	const category = $derived(products[0]?.category);
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
		class="table-scroll"
		role="region"
		aria-label={th ? 'ตารางสินค้า' : 'Product table'}
		tabindex="0"
	>
		<table>
			<thead>
				<tr>
					<th scope="col">{th ? 'สินค้า' : 'Product'}</th>
					{#each columns as column (column.key)}
						<th scope="col" class="figure">{column.label[locale]}</th>
					{:else}
						<th scope="col">{th ? 'สเปก' : 'Specifications'}</th>
					{/each}
					<th scope="col" class="figure">{th ? 'ราคา' : 'Price'}</th>
					<th scope="col" class="figure">{th ? 'คะแนน' : 'Rating'}</th>
					<th scope="col">{onAdd ? (th ? 'ตัวเลือก' : 'Actions') : th ? 'ดีล' : 'Deal'}</th>
				</tr>
			</thead>
			<tbody>
				{#each products as product (product.id)}
					<tr data-product={product.id}>
						<th scope="row">
							<a href={resolve(`/product/[id]?lang=${locale}&view=receipt`, { id: product.id })}>
								<FactValue productId={product.id} field="name" {locale} />
							</a>
						</th>
						{#each columns as column (column.key)}
							<td class="figure">
								<FactValue productId={product.id} field={`spec.${column.key}`} {locale} />
							</td>
						{:else}
							<td>
								<dl>
									{#each specs[product.category] as spec (spec.key)}
										{#if product.specs[spec.key] !== undefined}
											<div>
												<dt>{spec.label[locale]}</dt>
												<dd>
													<FactValue productId={product.id} field={`spec.${spec.key}`} {locale} />
												</dd>
											</div>
										{/if}
									{/each}
								</dl>
							</td>
						{/each}
						<td class="figure"><FactValue productId={product.id} field="price" {locale} /></td>
						<td class="figure"><FactValue productId={product.id} field="rating" {locale} /></td>
						<td>
							{#if onAdd}<AddToCart productId={product.id} {locale} {onAdd} />{/if}
							<button type="button" onclick={() => onDeal(product.id, locale)}>
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

<style>
	.table-scroll {
		max-inline-size: 100%;
		overflow-x: auto;
	}
	table {
		inline-size: 100%;
		border-collapse: collapse;
		text-align: start;
	}
	th,
	td {
		padding: 0.4rem 0.55rem;
		vertical-align: baseline;
		border-bottom: 1px solid var(--seam);
	}
	thead th {
		border-bottom: 2px solid var(--ink);
		text-align: start;
	}
	tbody th {
		text-align: start;
	}
	a,
	button {
		min-block-size: var(--tap, 44px);
		display: inline-flex;
		align-items: center;
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}
	a {
		min-inline-size: 8rem;
	}
	button {
		white-space: nowrap;
		cursor: pointer;
	}
	.figure {
		text-align: end;
		white-space: nowrap;
	}
	td.figure,
	dd {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace;
		font-variant-numeric: tabular-nums;
	}
	dl,
	dd {
		margin: 0;
	}
	dl div {
		display: flex;
		flex-wrap: wrap;
		gap: 0 0.4rem;
	}
	dt {
		color: var(--muted);
	}
</style>
