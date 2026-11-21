<script lang="ts">
	import closedCooker from '../../../lib/assets/products/cooker-one-button.jpg';
	import openCooker from '../../../lib/assets/products/cooker-open-detail.jpg';
	import type { catalog, Language, riceCookerSpecs } from '../../../lib/store-catalog';
	import { formatNumber } from '../../../lib/store-search';
	import SpecificationRows from './SpecificationRows.svelte';

	let {
		product,
		language,
		specs,
		openSpecifications
	}: {
		product: (typeof catalog)[number];
		language: Language;
		specs?: (typeof riceCookerSpecs)[string];
		openSpecifications: (trigger: HTMLButtonElement) => void;
	} = $props();
	const th = $derived(language === 'th');
</script>

<section id="details" aria-labelledby="details-title">
	{#if specs}
		<button
			class="specifications"
			type="button"
			aria-controls="product-specifications"
			aria-haspopup="dialog"
			onclick={(event) => openSpecifications(event.currentTarget)}
		>
			<span>{th ? 'คุณลักษณะ' : 'Specifications'}</span>
			<span class="preview" aria-hidden="true">
				{th ? 'ความจุ กำลังไฟ การรับประกัน' : 'Capacity, power, warranty'}
			</span>
			<svg
				viewBox="0 0 16 16"
				width="16"
				height="16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<path d="m6 3 4 5-4 5" />
			</svg>
		</button>
	{/if}
	<div class="description">
		<h2 id="details-title">{th ? 'รายละเอียดสินค้า' : 'Product details'}</h2>
		{#if product.id === 'cooker-1' && specs}
			<div class="feature-panels">
				<figure>
					<figcaption>
						<h3 data-fact="name" data-raw={product.name[language]}>{product.name[language]}</h3>
					</figcaption>
					<img
						src={closedCooker}
						alt={th ? 'หม้อหุงข้าวสีขาวแบบปุ่มเดียว' : 'White one-button rice cooker'}
						width="1254"
						height="1254"
						loading="lazy"
					/>
				</figure>
				<figure>
					<figcaption>
						<dl class="capacity">
							<dt>{th ? 'ความจุ' : 'Capacity'}</dt>
							<dd data-fact="capacity" data-raw={specs[0]}>
								{formatNumber(specs[0])}
								{th ? 'ลิตร' : 'L'}
							</dd>
						</dl>
					</figcaption>
					<img
						src={openCooker}
						alt={th ? 'หม้อหุงข้าวเปิดฝาเห็นข้าวสุก' : 'Open rice cooker with cooked rice'}
						width="840"
						height="1260"
						loading="lazy"
					/>
				</figure>
			</div>
		{:else}
			<p data-fact="name" data-raw={product.name[language]}>{product.name[language]}</p>
		{/if}
		{#if specs}
			<h3 class="information">{th ? 'ข้อมูลสินค้า' : 'Product information'}</h3>
			<SpecificationRows {specs} {th} />
		{/if}
	</div>
</section>

<style>
	section {
		scroll-margin-top: 4rem;
		border-top: 0.5rem solid #f3f3f3;
	}
	.specifications {
		display: grid;
		width: 100%;
		min-height: 48px;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5rem;
		border-bottom: 1px solid #e9e6dc;
		padding: 0.75rem 1rem;
		font-weight: 600;
		text-align: start;
		cursor: pointer;
	}
	.specifications:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: -3px;
	}
	.preview {
		overflow: hidden;
		color: #5d5d63;
		font-size: 0.875rem;
		font-weight: 400;
		text-align: end;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.description {
		padding: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.125rem;
		font-weight: 600;
	}
	.feature-panels {
		width: min(100%, 36rem);
		margin-inline: auto;
	}
	figure {
		margin: 0 0 0.75rem;
		background: #f3f3f3;
	}
	figcaption {
		padding: 1rem;
		text-align: center;
	}
	figcaption h3 {
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.35;
	}
	.capacity {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: baseline;
		gap: 0.5rem;
	}
	.capacity dd {
		font: 700 1.25rem var(--product-figure-font);
	}
	figure img {
		display: block;
		width: 100%;
		height: auto;
	}
	.information {
		margin: 1rem 0 0.25rem;
		font-size: 1rem;
	}
</style>
