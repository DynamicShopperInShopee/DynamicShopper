<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatBaht, specs, type Product } from '#lib/catalog/index.ts';
	import { catalog } from '#lib/store-catalog.ts';
	import { optimizeDeal, type PricingContext } from '#lib/pricing/index.ts';
	import type { Plan } from '#lib/harness/index.ts';
	import type { ExplanationBar } from '#lib/harness/ranking.ts';
	import FactValue from '#lib/storefront/FactValue.svelte';
	import CookerPhotoCaption from '#lib/storefront/CookerPhotoCaption.svelte';
	import CategoryGlyph from '#lib/CategoryGlyph.svelte';

	let {
		product,
		plan,
		photos = true,
		clock,
		onDeal,
		reasons = []
	}: {
		product: Product;
		plan: Plan;
		photos?: boolean;
		clock?: PricingContext;
		onDeal: (productId: string) => void;
		reasons?: readonly ExplanationBar[];
	} = $props();
	const locale = $derived(plan.language);
	const th = $derived(locale === 'th');
	const model = $derived(catalog.find((item) => item.catalogId === product.id));
	const columns = $derived.by(() => {
		const available = specs[product.category].filter(
			(spec) => product.specs[spec.key] !== undefined
		);
		return [
			...plan.highlightSpecs.flatMap((key) => available.filter((spec) => spec.key === key)),
			...available.filter((spec) => !plan.highlightSpecs.includes(spec.key))
		];
	});
	const deal = $derived(
		plan.cardFields.includes('vouchers') && clock
			? optimizeDeal([{ productId: product.id, quantity: 1 }], clock)
			: null
	);
	const theme = $derived(plan.theme === 'large-print' ? 'large' : plan.theme);
</script>

<article
	class="adaptive-card"
	data-product={product.id}
	data-density={plan.density}
	data-layout={plan.layout}
>
	<h3>
		<a
			href={resolve(`/product/[id]?lang=${locale}&theme=${theme}${photos ? '' : '&view=receipt'}`, {
				id: model?.id ?? product.id
			})}
		>
			<FactValue productId={product.id} field="name" {locale} />
		</a>
	</h3>
	<div class="fields">
		{#each plan.cardFields as field (field)}
			{#if field === 'image'}
				<div data-card-field={field} class="image">
					{#if photos && model}
						<div
							class="demo-photo"
							data-category={model.category}
							data-model={model.id}
							data-cooker-photo={product.id}
							aria-hidden={model.id === 'cooker-1' ? undefined : true}
						>
							{#if model.id === 'cooker-1'}<CookerPhotoCaption {locale} compact />{/if}
						</div>
					{:else if model}<div class="glyph" aria-hidden="true">
							<CategoryGlyph category={model.category} />
						</div>{/if}
				</div>
			{:else if field === 'price'}
				<div data-card-field={field} class="price">
					<FactValue tag="strong" productId={product.id} {field} {locale} />
					{#if product.originalPrice !== undefined}<span class="was">
							{th ? 'ราคาเดิม' : 'Was'}
							<FactValue tag="s" productId={product.id} field="originalPrice" {locale} />
						</span>{/if}
				</div>
			{:else if field === 'rating'}
				<div data-card-field={field} class="rating">
					<span>
						{th ? 'คะแนน' : 'Rating'}
						<FactValue productId={product.id} {field} {locale} />
					</span>
					<span>
						{th ? 'รีวิว' : 'Reviews'}
						<FactValue productId={product.id} field="reviewCount" {locale} />
					</span>
					<span>
						{th ? 'ขายแล้ว' : 'Sold'}
						<FactValue productId={product.id} field="sold" {locale} />
					</span>
				</div>
			{:else if field === 'specs' && columns.length}
				<dl data-card-field={field} class="specs">
					{#each columns as spec (spec.key)}<div>
							<dt>{spec.label[locale]}</dt>
							<dd><FactValue productId={product.id} field={`spec.${spec.key}`} {locale} /></dd>
						</div>{/each}
				</dl>
			{:else if field === 'summary'}
				<div data-card-field={field}>
					<FactValue tag="p" productId={product.id} {field} {locale} />
				</div>
			{:else if field === 'reviews'}
				<div data-card-field={field} class="reviews">
					{#each Object.keys(product.reviews) as index (index)}<blockquote>
							<FactValue productId={product.id} field={`review.${index}`} {locale} />
						</blockquote>{/each}
				</div>
			{:else if field === 'shipping'}
				<div data-card-field={field} class="line">
					<span>{th ? 'ค่าจัดส่ง' : 'Shipping'}</span><FactValue
						productId={product.id}
						{field}
						{locale}
					/>
				</div>
			{:else if field === 'shop'}
				<div data-card-field={field}><FactValue productId={product.id} {field} {locale} /></div>
			{:else if field === 'vouchers' && deal}
				<section
					data-card-field={field}
					class="vouchers"
					aria-label={th ? 'คูปองในราคาที่คำนวณ' : 'Vouchers in the calculated deal'}
				>
					<h4>{th ? 'คูปองในราคาที่คำนวณ' : 'Vouchers in the calculated deal'}</h4>
					{#each deal.appliedVouchers as voucher (voucher.code)}
						<div class="line">
							<span data-deal-fact="voucherCode" data-raw={voucher.code}>{voucher.code}</span><span
								data-deal-fact="voucherAmount"
								data-voucher={voucher.code}
								data-raw={voucher.amount}
							>
								{formatBaht(voucher.amount, locale)}
							</span>
						</div>
					{:else}<p>
							{th ? 'ไม่มีคูปองที่ใช้ได้ในชุดนี้' : 'No voucher applies to this combination.'}
						</p>{/each}
				</section>
			{/if}
		{/each}
	</div>
	<button type="button" onclick={() => onDeal(product.id)}>{th ? 'ราคาดีที่สุด' : 'Best price'}</button>
	{#if reasons.length}<details>
			<summary>{th ? 'ทำไมเรียงแบบนี้?' : 'Why this order?'}</summary>
			<ul>
				{#each reasons as reason (reason.label.en)}<li>
						{reason.label[locale]}<span class="rank-bar" style:width={`${reason.width * 25}%`}
						></span>
					</li>{/each}
			</ul>
		</details>{/if}
</article>

<style>
	.adaptive-card {
		--action-font-floor: var(--small, 0.875rem);
		--action-font-floor: var(--small, 14px);
		min-width: 0;
		height: 100%;
		box-sizing: border-box;
		border: 1px solid var(--seam, #e9e6dc);
		border-radius: var(--radius, 4px);
		background: var(--surface, #fff);
		padding: var(--card-padding, 0.875rem);
		display: flex;
		flex-direction: column;
		gap: calc(var(--card-padding, 0.875rem) * 0.75);
		overflow-wrap: anywhere;
	}
	.adaptive-card[data-density='compact'] {
		--card-padding: 0.5rem;
	}
	.adaptive-card[data-density='comfortable'] {
		--card-padding: 0.875rem;
	}
	.adaptive-card[data-density='spacious'] {
		--card-padding: 1.25rem;
	}
	h3,
	h4,
	p,
	dl,
	dd,
	blockquote {
		margin: 0;
	}
	h3 {
		font-size: 1.125em;
		line-height: 1.4;
	}
	h4 {
		font-size: 1em;
	}
	a {
		color: inherit;
		display: inline-flex;
		min-height: var(--tap, 44px);
		align-items: center;
	}
	.fields {
		display: flex;
		flex-direction: column;
		gap: calc(var(--card-padding, 0.875rem) * 0.75);
	}
	.image {
		width: 100%;
		max-width: 26rem;
		align-self: center;
	}
	.demo-photo,
	.glyph {
		aspect-ratio: 1;
		position: relative;
	}
	.glyph {
		display: grid;
		place-items: center;
		background: var(--seam, #e9e6dc);
	}
	.glyph :global(svg) {
		width: 50%;
		height: 50%;
	}
	.price {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
	}
	.price :global(strong) {
		font-size: 1.6em;
	}
	.was {
		color: var(--muted, #5d5d63);
	}
	.rating {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
	}
	.line,
	.specs > div {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.25rem 1rem;
	}
	.specs {
		display: grid;
		gap: 0.25rem;
	}
	dt {
		color: var(--muted, #5d5d63);
	}
	dd {
		text-align: end;
	}
	blockquote {
		border-inline-start: 1px solid var(--seam, #e9e6dc);
		padding-inline-start: 0.75rem;
	}
	.reviews {
		display: grid;
		gap: 0.75rem;
	}
	.vouchers {
		border-block: 1px dashed var(--seam, #e9e6dc);
		padding-block: 0.75rem;
		display: grid;
		gap: 0.5rem;
	}
	:global(.adaptive-card [data-fact]),
	[data-deal-fact] {
		font-variant-numeric: tabular-nums;
	}
	:global(.adaptive-card [data-fact='price']),
	:global(.adaptive-card [data-fact='originalPrice']),
	:global(.adaptive-card [data-fact='shipping']),
	:global(.adaptive-card [data-fact='rating']),
	:global(.adaptive-card [data-fact='reviewCount']),
	:global(.adaptive-card [data-fact='sold']),
	:global(.adaptive-card [data-fact^='spec.']),
	[data-deal-fact='voucherAmount'] {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace;
	}
	button {
		min-height: var(--tap, 44px);
		font: inherit;
		color: inherit;
		border: 1px solid var(--ink, #16161a);
		border-radius: var(--radius, 4px);
		background: var(--surface, #fff);
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		margin-top: auto;
	}
	summary {
		min-height: var(--tap, 44px);
		cursor: pointer;
		align-content: center;
	}
	a:focus-visible,
	button:focus-visible,
	summary:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: 2px;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	.rank-bar {
		display: block;
		height: 6px;
		background: currentColor;
		margin-block: 6px;
	}
	@media (min-width: 640px) {
		.adaptive-card[data-layout='list'] .image {
			max-width: 18rem;
			align-self: start;
		}
	}
</style>
