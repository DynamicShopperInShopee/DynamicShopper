<script lang="ts">
	import { resolve } from '$app/paths';
	import CategoryGlyph from '../../../lib/CategoryGlyph.svelte';
	import { riceCookerSpecs } from '../../../lib/store-catalog';
	import { formatBaht, formatNumber } from '../../../lib/store-search';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const product = $derived(data.product);
	const th = $derived(data.language === 'th');
	const specs = $derived(riceCookerSpecs[product.id]);
	const fields = $derived([
		{ key: 'capacity', label: th ? 'ความจุ' : 'Capacity', unit: th ? 'ลิตร' : 'L' },
		{ key: 'power', label: th ? 'กำลังไฟ' : 'Power', unit: th ? 'วัตต์' : 'W' },
		{ key: 'programs', label: th ? 'โปรแกรมหุง' : 'Cooking programs', unit: '' },
		{ key: 'warranty', label: th ? 'การรับประกัน' : 'Warranty', unit: th ? 'ปี' : 'years' }
	]);
</script>

<svelte:head><title>{product.name[data.language]} · DynamicShopper</title></svelte:head>

<main lang={data.language} data-product={product.id}>
	<header>
		<a href={resolve('/')}>{th ? 'กลับหน้าร้าน' : 'Back to store'}</a>
		<a href={`${resolve('/product/[id]', { id: product.id })}?lang=${th ? 'en' : 'th'}`}>
			{th ? 'English' : 'ไทย'}
		</a>
	</header>
	<div class="listing">
		<div class="art" class:cooker={product.category === 'cooker'} aria-hidden="true">
			{#if product.category !== 'cooker'}<CategoryGlyph category={product.category} />{/if}
		</div>
		<section aria-labelledby="product-title">
			<h1 id="product-title" data-fact="name" data-raw={product.name[data.language]}>
				{product.name[data.language]}
			</h1>
			<p data-fact="shop" data-raw={product.shop}>{product.shop}</p>
			<dl>
				<div>
					<dt>{th ? 'ราคา' : 'Price'}</dt>
					<dd data-fact="price" data-raw={product.price}>{formatBaht(product.price)}</dd>
				</div>
				{#if product.originalPrice !== null}
					<div>
						<dt>{th ? 'ราคาเดิม' : 'Original price'}</dt>
						<dd data-fact="originalPrice" data-raw={product.originalPrice}>
							<s>{formatBaht(product.originalPrice)}</s>
						</dd>
					</div>
				{/if}
				<div>
					<dt>{th ? 'ค่าจัดส่ง' : 'Shipping'}</dt>
					<dd data-fact="shipping" data-raw={product.shipping}>
						{product.shipping === 0 ? (th ? 'ฟรี' : 'Free') : formatBaht(product.shipping)}
					</dd>
				</div>
				<div>
					<dt>{th ? 'คะแนน' : 'Rating'}</dt>
					<dd data-fact="rating" data-raw={product.rating}>{formatNumber(product.rating)}</dd>
				</div>
				<div>
					<dt>{th ? 'ขายแล้ว' : 'Sold'}</dt>
					<dd data-fact="sold" data-raw={product.sold}>{formatNumber(product.sold)}</dd>
				</div>
			</dl>
			{#if specs}
				<details>
					<summary>{th ? 'สเปกสินค้า' : 'Specifications'}</summary>
					<dl>
						{#each fields as field, index (field.key)}
							<div>
								<dt>{field.label}</dt>
								<dd data-fact={field.key} data-raw={specs[index]}>
									{formatNumber(specs[index])}{field.unit ? ` ${field.unit}` : ''}
								</dd>
							</div>
						{/each}
					</dl>
				</details>
			{/if}
		</section>
	</div>
</main>

<style>
	main {
		max-width: 72rem;
		margin: auto;
		padding: 0 1rem 2rem;
		color: #16161a;
		background: #fbfbf8;
	}
	header {
		display: flex;
		justify-content: space-between;
		border-bottom: 1px solid #e9e6dc;
		margin-bottom: 1rem;
	}
	header a,
	summary {
		min-height: 44px;
		display: flex;
		align-items: center;
		color: inherit;
	}
	.listing {
		display: grid;
		gap: 1rem;
	}
	.art {
		width: 100%;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		background: #e9e6dc;
	}
	.cooker {
		background: white url('../../../lib/assets/products/demo-categories.jpg') no-repeat 0 100% /
			300% 200%;
	}
	h1 {
		font-size: clamp(1.5rem, 4vw, 2rem);
		overflow-wrap: anywhere;
	}
	dl {
		margin: 1rem 0;
		border-block: 1px dashed #777;
		padding-block: 0.5rem;
	}
	dl div {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		padding: 0.25rem 0;
	}
	dd {
		margin: 0;
		font-family: ui-monospace, monospace;
	}
	summary {
		cursor: pointer;
		font-weight: 600;
	}
	@media (min-width: 700px) {
		.listing {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
</style>
