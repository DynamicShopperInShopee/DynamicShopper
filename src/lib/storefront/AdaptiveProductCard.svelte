<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SpecDefinition } from '../catalog';
	import type { ShopperPlan } from '../personalization/plan';
	import type { AppliedVoucher } from '../pricing';
	import type { catalog } from '../store-catalog';
	import ShelfArtwork from './ShelfArtwork.svelte';
	import FactValue from './FactValue.svelte';
	import { storefrontCopy } from './copy';

	let {
		product,
		plan,
		caption,
		columns,
		vouchers,
		href,
		children
	}: {
		product: (typeof catalog)[number];
		plan: ShopperPlan;
		caption: boolean;
		columns: readonly SpecDefinition[];
		vouchers: readonly AppliedVoucher[];
		href: string;
		children: Snippet;
	} = $props();
	const id = $derived(product.catalogId);
	const locale = $derived(plan.locale);
	const t = $derived(storefrontCopy[locale]);
</script>

<li
	class="product relative flex min-w-0 flex-col gap-2 rounded-[var(--radius)] border border-[var(--seam)] bg-[var(--surface)] p-[0.8rem] wrap-anywhere has-[.product-link:focus-visible]:outline-2 has-[.product-link:focus-visible]:outline-offset-2 has-[.product-link:focus-visible]:outline-[var(--accent)] data-[density=compact]:gap-[0.3rem] data-[density=compact]:p-2 data-[density=spacious]:gap-[0.65rem] data-[density=spacious]:p-4"
	data-product={id}
	data-product-card={id}
	data-density={plan.density}
>
	<!-- eslint-disable svelte/no-navigation-without-resolve -- The storefront resolves this listing URL with its current theme and return route. -->
	<h3 class="m-0 text-[length:var(--size)]">
		<a
			class="product-link text-[var(--ink)] no-underline after:absolute after:inset-0 after:content-['']"
			{href}
		>
			<FactValue productId={id} field="name" {locale} />
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</h3>
	{#each plan.details as field (field)}
		{#if field === 'image'}
			<div
				class="art grid min-h-[7.5rem] place-items-center bg-[var(--tile,#e9e6dc)] text-[var(--accent)]"
				data-card-field={field}
			>
				<ShelfArtwork {id} category={product.category} {locale} {caption} />
			</div>
		{:else if field === 'price'}
			<div
				class={[
					'price flex flex-wrap items-baseline gap-x-[0.6rem] gap-y-1 [&_s]:text-[length:var(--small)] [&_s]:text-[var(--void)] [&_strong]:text-[length:max(1.45rem,var(--size))]'
				]}
				data-card-field={field}
			>
				<span class="sr-only absolute h-px w-px overflow-hidden [clip-path:inset(50%)]">
					{t.price}
				</span>
				<FactValue productId={id} {field} {locale} tag="strong" class="figure" />
				{#if product.originalPrice !== null}
					<span class="sr-only absolute h-px w-px overflow-hidden [clip-path:inset(50%)]">
						{t.was}
					</span>
					<FactValue productId={id} field="originalPrice" {locale} tag="s" class="figure" />
				{/if}
			</div>
		{:else if field === 'rating'}
			<div
				class="metadata flex flex-wrap items-baseline justify-between gap-x-[0.6rem] gap-y-1 text-[length:var(--small)] text-[var(--muted)]"
				data-card-field={field}
			>
				<span>{t.rating} <FactValue productId={id} {field} {locale} class="figure" /></span>
				<span>{t.sold} <FactValue productId={id} field="sold" {locale} class="figure" /></span>
			</div>
		{:else if field === 'shipping'}
			<div
				class="shipping flex flex-wrap items-baseline gap-x-[0.6rem] gap-y-1 py-1 text-[length:var(--small)] text-[var(--muted)] [border-block-end:1px_dashed_var(--seam)]"
				data-card-field={field}
			>
				{t.shipping}<span
					class="leader flex-1 [border-bottom:1px_dotted_var(--muted)]"
					aria-hidden="true"
				></span><FactValue productId={id} {field} {locale} class="figure" />
			</div>
		{:else if field === 'shop' || field === 'summary' || field === 'reviews'}
			<p class="m-0" data-card-field={field}>
				<FactValue productId={id} field={field === 'reviews' ? 'review.0' : field} {locale} />
			</p>
		{:else if field === 'specs' && columns.length}
			<dl class="card-specs m-0" data-card-field={field}>
				{#each columns as spec (spec.key)}
					<div
						class="flex flex-wrap items-baseline justify-between gap-x-[0.6rem] gap-y-1 py-1 [border-block-end:1px_dashed_var(--seam)]"
					>
						<dt>{spec.label[locale]}</dt>
						<dd class="m-0"><FactValue productId={id} field={`spec.${spec.key}`} {locale} /></dd>
					</div>
				{/each}
			</dl>
		{:else if field === 'vouchers' && vouchers.length}
			<ul
				class="card-vouchers m-0 ps-5"
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
