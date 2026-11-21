<script lang="ts">
	import type { PageData } from './$types';
	import introCooker from '../../../lib/assets/products/cooker-intro.jpg';
	import ProductSpecificationTiles from './ProductSpecificationTiles.svelte';
	import DigitalCookerDescription from './DigitalCookerDescription.svelte';
	import servingCooker from '../../../lib/assets/products/cooker-serving.jpg';
	import cookerSwitch from '../../../lib/assets/products/cooker-switch-detail.jpg';

	let {
		data,
		openSpecifications,
		receipt = false
	}: {
		data: PageData;
		receipt?: boolean;
		openSpecifications?: (trigger: HTMLButtonElement) => void;
	} = $props();
	const th = $derived(data.language === 'th');
	const capacity = $derived(
		data.specs.find((spec) => spec.attributes['data-fact'] === 'spec.capacity')
	);
</script>

<section
	id={receipt ? undefined : 'details'}
	aria-labelledby={!receipt || data.listingDetails || data.id === 'cooker-one-button'
		? 'details-title'
		: undefined}
>
	{#if data.specs.length}
		<button
			type="button"
			class="attributes"
			aria-label={th ? 'ดูคุณลักษณะสินค้า' : 'View attributes'}
			aria-controls="product-specifications"
			aria-haspopup="dialog"
			disabled={!openSpecifications}
			onclick={(event) => openSpecifications?.(event.currentTarget)}
		>
			<strong>{th ? 'คุณลักษณะ' : 'Attributes'}</strong>
			<span>{data.specs.map((spec) => spec.label).join(', ')}</span>
			<svg
				aria-hidden="true"
				viewBox="0 0 16 16"
				width="16"
				height="16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="m6 3 5 5-5 5" />
			</svg>
		</button>
	{/if}
	{#if !receipt || data.listingDetails || data.id === 'cooker-one-button'}
		<div class="body">
			<h2 id="details-title">
				{receipt && !data.listingDetails
					? th
						? 'ภาพจากหน้าสินค้า'
						: 'Photos from the listing'
					: th
						? 'รายละเอียดสินค้า'
						: 'Product details'}
			</h2>
			{#if data.listingDetails}
				<DigitalCookerDescription {data} details={data.listingDetails} />
			{:else if data.id === 'cooker-one-button'}
				<div class="story">
					<figure id="cooker-exterior">
						<figcaption class="intro-caption">
							<h3 {...data.name.attributes}>{data.name.text}</h3>
							{#if !receipt}<p {...data.summary.attributes}>{data.summary.text}</p>{/if}
						</figcaption>
						<img
							src={introCooker}
							alt={th ? 'หม้อหุงข้าวสีขาวบนเคาน์เตอร์ครัว' : 'White rice cooker on a kitchen counter'}
							width="700"
							height="1050"
							loading="lazy"
						/>
					</figure>
					{#if !receipt}<ProductSpecificationTiles specs={data.specs} {th} />{/if}
					<figure id="cooker-capacity">
						{#if capacity}
							<figcaption class="capacity-caption">
								{capacity.label} <strong {...capacity.attributes}>{capacity.text}</strong>
							</figcaption>
						{/if}
						<img
							src={servingCooker}
							alt={th
								? 'คนตักข้าวใส่ถ้วยข้างหม้อหุงข้าวที่เปิดฝา'
								: 'A person serving rice beside the open cooker'}
							width="700"
							height="1050"
							loading="lazy"
						/>
					</figure>
					<figure id="cooker-switch">
						<figcaption>{th ? 'สวิตช์ด้านหน้า' : 'Front switch'}</figcaption>
						<img
							src={cookerSwitch}
							alt={th
								? 'มือกดสวิตช์ด้านหน้าหม้อหุงข้าว'
								: 'A hand pressing the switch on the front of the cooker'}
							width="700"
							height="1050"
							loading="lazy"
						/>
					</figure>
				</div>
			{:else if !data.specs.length}
				<p {...data.summary.attributes}>{data.summary.text}</p>
			{/if}
			{#if !receipt && data.specs.length && !data.listingDetails}
				<h3>{th ? 'จุดเด่น' : 'Highlights'}</h3>
				<p class="text-summary" {...data.summary.attributes}>{data.summary.text}</p>
				<h3>{th ? 'ข้อมูลสินค้า' : 'Product information'}</h3>
				<dl class="information">
					<div>
						<dt>{th ? 'สินค้า' : 'Product'}</dt>
						<dd {...data.name.attributes}>{data.name.text}</dd>
					</div>
					{#if data.shop}
						<div>
							<dt>{th ? 'ร้านค้า' : 'Seller'}</dt>
							<dd {...data.shop.attributes}>{data.shop.text}</dd>
						</div>
					{/if}
					{#each data.specs as spec (spec.attributes['data-fact'])}
						<div>
							<dt>{spec.label}</dt>
							<dd
								class:figure={Number.isFinite(Number(spec.attributes['data-raw']))}
								{...spec.attributes}
							>
								{spec.text}
							</dd>
						</div>
					{/each}
				</dl>
			{/if}
		</div>
	{/if}
</section>

<style>
	section {
		border-top: 8px solid var(--seam, #f2f2f2);
		scroll-margin-top: 4rem;
	}
	.attributes {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.55em;
		width: 100%;
		min-height: var(--tap, 44px);
		padding: 0.75em 0.8rem;
		border-bottom: 1px solid var(--seam, #e9e6dc);
		color: inherit;
		background: #fff;
		font: inherit;
		cursor: pointer;
	}
	.attributes strong {
		font-weight: 600;
	}
	.attributes span {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		text-align: right;
		color: #565656;
	}
	.attributes:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: -3px;
	}
	.body {
		padding: 0.85rem 0.8rem 1.6rem;
	}
	h2,
	h3 {
		margin: 0 0 0.75em;
		font-size: 1em;
		font-weight: 600;
	}
	h3 {
		margin-block: 1.3em 0.4em;
	}
	.story {
		max-width: 38rem;
		margin-inline: auto;
	}
	figure {
		scroll-margin-top: 4rem;
		margin: 0;
		background: #efeeed;
	}
	#cooker-capacity {
		position: relative;
		background: #f6f6f4;
	}
	.capacity-caption {
		position: absolute;
		top: 4%;
		inset-inline: 5%;
		padding: 0;
	}
	figcaption {
		padding: 1.8em 0.9em 1.25em;
		text-align: center;
		font-size: 1.25em;
		font-weight: 600;
		line-height: 1.35;
		color: #444;
	}
	figcaption strong {
		font-family: var(--product-figure-font);
	}
	figure img {
		display: block;
		width: 100%;
		height: auto;
	}
	dl {
		margin: 0;
	}
	dl div {
		display: grid;
		grid-template-columns: minmax(6rem, 36%) 1fr;
		gap: 0.7em;
		padding: 0.4em 0;
		line-height: 1.5;
	}
	dt {
		color: #555;
	}
	dd {
		margin: 0;
		font-family: var(--product-figure-font);
	}
	@media (min-width: 700px) {
		.body {
			max-width: 56rem;
			margin-inline: auto;
		}
	}
	#cooker-exterior {
		position: relative;
	}
	.intro-caption {
		position: absolute;
		top: 6%;
		inset-inline: 5%;
		padding: 0;
		text-align: start;
	}
	.intro-caption h3 {
		margin: 0;
		font-size: max(1.5rem, var(--action-font-floor, 0rem));
		font-weight: 600;
		line-height: 1.35;
	}
	.intro-caption p {
		border-top: 1px solid #858172;
		padding-top: 1rem;
		margin-top: 1.2rem;
		font-size: max(1rem, var(--action-font-floor, 0rem));
		font-weight: 400;
		line-height: 1.5;
	}
	.information {
		color: #555;
	}
	.information dd {
		font-family: inherit;
	}
	.information dd.figure {
		font-family: var(--product-figure-font);
	}
	.text-summary {
		margin: 0 0 1rem;
		color: #555;
		line-height: 1.6;
	}
</style>
