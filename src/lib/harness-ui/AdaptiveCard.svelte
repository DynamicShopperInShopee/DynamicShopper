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
	class={[
		"adaptive-card group/adaptive box-border flex h-full min-w-0 flex-col gap-[calc(var(--card-padding,0.875rem)*0.75)] rounded-[var(--radius,4px)] border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-[var(--card-padding,0.875rem)] wrap-anywhere [--action-font-floor:var(--small,14px)] data-[density=comfortable]:[--card-padding:0.875rem] data-[density=compact]:[--card-padding:0.5rem] data-[density=spacious]:[--card-padding:1.25rem] [&_[data-fact]]:tabular-nums [&_[data-fact]:is([data-fact=price],[data-fact=originalPrice],[data-fact=shipping],[data-fact=rating],[data-fact=reviewCount],[data-fact=sold],[data-fact^='spec.'])]:[font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace]"
	]}
	data-product={product.id}
	data-density={plan.density}
	data-layout={plan.layout}
>
	<h3 class="m-0 text-[1.125em]/[1.4]">
		<a
			class="inline-flex min-h-[var(--tap,44px)] items-center text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)]"
			href={resolve(`/product/[id]?lang=${locale}&theme=${theme}${photos ? '' : '&view=receipt'}`, {
				id: model?.id ?? product.id
			})}
		>
			<FactValue productId={product.id} field="name" {locale} />
		</a>
	</h3>
	<div class="fields flex flex-col gap-[calc(var(--card-padding,0.875rem)*0.75)]">
		{#each plan.cardFields as field (field)}
			{#if field === 'image'}
				<div
					data-card-field={field}
					class="image w-full max-w-[26rem] self-center min-[640px]:group-data-[layout=list]/adaptive:max-w-72 min-[640px]:group-data-[layout=list]/adaptive:[align-self:start]"
				>
					{#if photos && model}
						<div
							class="demo-photo relative aspect-square"
							data-category={model.category}
							data-model={model.id}
							data-cooker-photo={product.id}
							aria-hidden={model.id === 'cooker-1' ? undefined : true}
						>
							{#if model.id === 'cooker-1'}<CookerPhotoCaption {locale} compact />{/if}
						</div>
					{:else if model}<div
							class={[
								'glyph relative grid aspect-square place-items-center bg-[var(--seam,#e9e6dc)] [&_svg]:size-1/2'
							]}
							aria-hidden="true"
						>
							<CategoryGlyph category={model.category} />
						</div>{/if}
				</div>
			{:else if field === 'price'}
				<div
					data-card-field={field}
					class={['price flex flex-wrap items-baseline gap-2 [&_strong]:text-[1.6em]']}
				>
					<FactValue tag="strong" productId={product.id} {field} {locale} />
					{#if product.originalPrice !== undefined}<span class="was text-[var(--muted,#5d5d63)]">
							{th ? 'ราคาเดิม' : 'Was'}
							<FactValue tag="s" productId={product.id} field="originalPrice" {locale} />
						</span>{/if}
				</div>
			{:else if field === 'rating'}
				<div data-card-field={field} class="rating flex flex-wrap gap-x-4 gap-y-2">
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
				<dl data-card-field={field} class="specs m-0 grid gap-1">
					{#each columns as spec (spec.key)}<div
							class="flex flex-wrap justify-between gap-x-4 gap-y-1"
						>
							<dt class="text-[var(--muted,#5d5d63)]">{spec.label[locale]}</dt>
							<dd class="m-0 text-end">
								<FactValue productId={product.id} field={`spec.${spec.key}`} {locale} />
							</dd>
						</div>{/each}
				</dl>
			{:else if field === 'summary'}
				<div data-card-field={field}>
					<FactValue tag="p" productId={product.id} {field} {locale} />
				</div>
			{:else if field === 'reviews'}
				<div data-card-field={field} class="reviews grid gap-3">
					{#each Object.keys(product.reviews) as index (index)}<blockquote
							class="m-0 border-s border-[var(--seam,#e9e6dc)] ps-3"
						>
							<FactValue productId={product.id} field={`review.${index}`} {locale} />
						</blockquote>{/each}
				</div>
			{:else if field === 'shipping'}
				<div data-card-field={field} class="line flex flex-wrap justify-between gap-x-4 gap-y-1">
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
					class="vouchers grid gap-2 border-y border-dashed border-[var(--seam,#e9e6dc)] py-3"
					aria-label={th ? 'คูปองในราคาที่คำนวณ' : 'Vouchers in the calculated deal'}
				>
					<h4 class="m-0 text-[1em]">
						{th ? 'คูปองในราคาที่คำนวณ' : 'Vouchers in the calculated deal'}
					</h4>
					{#each deal.appliedVouchers as voucher (voucher.code)}
						<div class="line flex flex-wrap justify-between gap-x-4 gap-y-1">
							<span class="tabular-nums" data-deal-fact="voucherCode" data-raw={voucher.code}>
								{voucher.code}
							</span><span
								class="[font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] tabular-nums"
								data-deal-fact="voucherAmount"
								data-voucher={voucher.code}
								data-raw={voucher.amount}
							>
								{formatBaht(voucher.amount, locale)}
							</span>
						</div>
					{:else}<p class="m-0">
							{th ? 'ไม่มีคูปองที่ใช้ได้ในชุดนี้' : 'No voucher applies to this combination.'}
						</p>{/each}
				</section>
			{/if}
		{/each}
	</div>
	<button
		class="mt-auto min-h-[var(--tap,44px)] cursor-pointer rounded-[var(--radius,4px)] border border-[var(--ink,#16161a)] bg-[var(--surface,#fff)] px-3 py-2 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)]"
		type="button"
		onclick={() => onDeal(product.id)}
	>
		{th ? 'ราคาดีที่สุด' : 'Best price'}
	</button>
	{#if reasons.length}<details>
			<summary
				class="min-h-[var(--tap,44px)] cursor-pointer content-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)]"
			>
				{th ? 'ทำไมเรียงแบบนี้?' : 'Why this order?'}
			</summary>
			<ul class="list-none p-0">
				{#each reasons as reason (reason.label.en)}<li>
						{reason.label[locale]}<span
							class="rank-bar my-[6px] block h-[6px] bg-current"
							class:w-[25%]={reason.width === 1}
							class:w-[50%]={reason.width === 2}
							class:w-[75%]={reason.width === 3}
							class:w-full={reason.width === 4}
						></span>
					</li>{/each}
			</ul>
		</details>{/if}
</article>
