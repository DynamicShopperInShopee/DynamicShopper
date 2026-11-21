<script lang="ts">
	import { resolve } from '$app/paths';
	import { specs, type Locale, type Product, type SpecKey } from '../catalog';
	import FactValue from './FactValue.svelte';
	import { assistantCopy } from './copy';

	let {
		products,
		locale,
		onDeal,
		explain,
		highlightedSpecs = []
	}: {
		products: readonly Product[];
		locale: Locale;
		onDeal: (productId: string, locale: Locale) => void;
		explain?: (productId: string) => readonly string[];
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
					<th scope="col">{th ? 'ดีล' : 'Deal'}</th>
				</tr>
			</thead>
			<tbody>
				{#each products as product (product.id)}
					{@const reasons = explain?.(product.id) ?? []}
					<tr data-product={product.id}>
						<th scope="row">
							<a href={resolve(`/product/[id]?lang=${locale}&view=receipt`, { id: product.id })}>
								<FactValue productId={product.id} field="name" {locale} />
							</a>
							{#if reasons.length}
								<details>
									<summary>{assistantCopy[locale].rank}</summary>
									<div class="ranking-reasons">
										<p>{th ? 'เหตุผลสำคัญเรียงก่อน' : 'Biggest reasons first'}</p>
										<ul role="list">
											{#each reasons as reason (reason)}
												<li>{reason}</li>
											{/each}
										</ul>
									</div>
								</details>
							{/if}
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
	button,
	summary {
		min-block-size: var(--tap, 44px);
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}
	a,
	button {
		display: inline-flex;
		align-items: center;
	}
	a {
		min-inline-size: 8rem;
	}
	button {
		white-space: nowrap;
		cursor: pointer;
	}
	summary {
		align-content: center;
		cursor: pointer;
	}
	.ranking-reasons {
		border: 1px dashed var(--ink);
		padding: 0.5rem;
		font-weight: normal;
	}
	.ranking-reasons p {
		margin: 0 0 0.25rem;
		font-weight: 600;
	}
	.ranking-reasons ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.ranking-reasons li {
		display: grid;
		grid-template-columns: 1fr 2.5rem;
		align-items: center;
		gap: 0.4rem;
	}
	.ranking-reasons li::after {
		content: '';
		block-size: 0.2rem;
		inline-size: 100%;
		background: var(--ink);
	}
	.ranking-reasons li:nth-child(2)::after {
		inline-size: 75%;
	}
	.ranking-reasons li:nth-child(3)::after {
		inline-size: 50%;
	}
	.ranking-reasons li:nth-child(n + 4)::after {
		inline-size: 25%;
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
