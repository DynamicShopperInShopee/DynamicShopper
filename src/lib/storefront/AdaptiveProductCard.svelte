<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SpecDefinition } from '../catalog';
	import type { ShopperPlan } from '../personalization/plan';
	import type { AppliedVoucher } from '../pricing';
	import type { catalog } from '../store-catalog';
	import CategoryGlyph from '../CategoryGlyph.svelte';
	import CookerPhotoCaption from './CookerPhotoCaption.svelte';
	import FactValue from './FactValue.svelte';
	import { storefrontCopy } from './copy';

	let {
		product,
		plan,
		photos,
		columns,
		vouchers,
		href,
		children
	}: {
		product: (typeof catalog)[number];
		plan: ShopperPlan;
		photos: boolean;
		columns: readonly SpecDefinition[];
		vouchers: readonly AppliedVoucher[];
		href: string;
		children: Snippet;
	} = $props();
	const id = $derived(product.catalogId);
	const locale = $derived(plan.locale);
	const t = $derived(storefrontCopy[locale]);
</script>

<li class="product" data-product={id} data-product-card={id} data-density={plan.density}>
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The storefront resolves this listing URL with its current theme and return route. -->
	<h3><a class="product-link" {href}><FactValue productId={id} field="name" {locale} /></a></h3>
	{#each plan.details as field (field)}
		{#if field === 'image'}
			{#if photos}
				<div
					class="art demo-photo"
					data-card-field={field}
					data-category={product.category}
					data-model={product.id}
					data-cooker-photo={id}
					aria-hidden={product.id === 'cooker-1' ? undefined : true}
				>
					{#if product.id === 'cooker-1'}<CookerPhotoCaption {locale} compact />{/if}
				</div>
			{:else}
				<div class="art glyph" data-card-field={field} aria-hidden="true">
					<CategoryGlyph category={product.category} />
				</div>
			{/if}
		{:else if field === 'price'}
			<div class="price" data-card-field={field}>
				<span class="sr-only">{t.price}</span>
				<FactValue productId={id} {field} {locale} tag="strong" class="figure" />
				{#if product.originalPrice !== null}
					<span class="sr-only">{t.was}</span>
					<FactValue productId={id} field="originalPrice" {locale} tag="s" class="figure" />
				{/if}
			</div>
		{:else if field === 'rating'}
			<div class="metadata" data-card-field={field}>
				<span>{t.rating} <FactValue productId={id} {field} {locale} class="figure" /></span>
				<span>{t.sold} <FactValue productId={id} field="sold" {locale} class="figure" /></span>
			</div>
		{:else if field === 'shipping'}
			<div class="shipping" data-card-field={field}>
				{t.shipping}<span class="leader" aria-hidden="true"></span><FactValue
					productId={id}
					{field}
					{locale}
					class="figure"
				/>
			</div>
		{:else if field === 'shop' || field === 'summary' || field === 'reviews'}
			<p data-card-field={field}>
				<FactValue productId={id} field={field === 'reviews' ? 'review.0' : field} {locale} />
			</p>
		{:else if field === 'specs' && columns.length}
			<dl class="card-specs" data-card-field={field}>
				{#each columns as spec (spec.key)}
					<div>
						<dt>{spec.label[locale]}</dt>
						<dd><FactValue productId={id} field={`spec.${spec.key}`} {locale} /></dd>
					</div>
				{/each}
			</dl>
		{:else if field === 'vouchers' && vouchers.length}
			<ul
				class="card-vouchers"
				data-card-field={field}
				aria-label={locale === 'th' ? 'โค้ดส่วนลด' : 'Vouchers'}
			>
				{#each vouchers as voucher (voucher.code)}
					<li>
						<span
							data-source="pricing"
							data-product={id}
							data-field="voucher.code"
							data-raw={JSON.stringify(voucher.code)}
						>
							{voucher.code}
						</span>
						{#if voucher.expiresSoon}
							<span
								data-source="pricing"
								data-product={id}
								data-field="voucher.expiresSoon"
								data-raw="true"
							>
								· {locale === 'th' ? 'ใกล้หมดอายุ' : 'Expires soon'}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
	{@render children()}
</li>

<style>
	.product {
		position: relative;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.8rem;
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		background: var(--surface);
		overflow-wrap: anywhere;
	}
	.product[data-density='compact'] {
		gap: 0.3rem;
		padding: 0.5rem;
	}
	.product[data-density='spacious'] {
		gap: 0.65rem;
		padding: 1rem;
	}
	h3,
	p,
	dl,
	ul,
	dd {
		margin: 0;
	}
	h3 {
		font-size: var(--size);
	}
	.product-link {
		color: var(--ink);
		text-decoration: none;
	}
	.product-link::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.product:has(.product-link:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.art {
		min-height: 7.5rem;
		display: grid;
		place-items: center;
		color: var(--accent);
	}
	.glyph {
		background: #e9e6dc;
	}
	.price,
	.metadata,
	.shipping,
	.card-specs > div {
		display: flex;
		gap: 0.25rem 0.6rem;
		align-items: baseline;
		flex-wrap: wrap;
	}
	.price :global(strong) {
		font-size: max(1.45rem, var(--size));
	}
	.price :global(s) {
		color: var(--void);
		font-size: var(--small);
	}
	.metadata,
	.card-specs > div {
		justify-content: space-between;
	}
	.shipping,
	.card-specs > div {
		padding-block: 0.25rem;
		border-block-end: 1px dashed var(--seam);
	}
	.metadata,
	.shipping {
		color: var(--muted);
		font-size: var(--small);
	}
	.leader {
		flex: 1;
		border-bottom: 1px dotted var(--muted);
	}
	.card-vouchers {
		padding-inline-start: 1.25rem;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
</style>
