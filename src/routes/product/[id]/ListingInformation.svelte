<script lang="ts">
	import type { PageData } from './$types';
	import closedCooker from '../../../lib/assets/products/cooker-one-button.jpg';
	import openCooker from '../../../lib/assets/products/cooker-open-detail.jpg';
	import cookerSwitch from '../../../lib/assets/products/cooker-switch-detail.jpg';

	let {
		data,
		openSpecifications
	}: {
		data: PageData;
		openSpecifications?: (trigger: HTMLButtonElement) => void;
	} = $props();
	const th = $derived(data.language === 'th');
	const capacity = $derived(
		data.specs.find((spec) => spec.attributes['data-fact'] === 'spec.capacity')
	);
</script>

<section id="details" aria-labelledby="details-title">
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
	<div class="body">
		<h2 id="details-title">{th ? 'รายละเอียดสินค้า' : 'Product details'}</h2>
		{#if data.id === 'cooker-one-button'}
			<div class="story">
				<figure id="cooker-exterior">
					<figcaption class="name" {...data.name.attributes}>{data.name.text}</figcaption>
					<img
						src={closedCooker}
						alt={th ? 'หม้อหุงข้าวสีขาวบนเคาน์เตอร์ครัว' : 'White rice cooker on a kitchen counter'}
						width="1254"
						height="1254"
						loading="lazy"
					/>
				</figure>
				<figure id="cooker-capacity">
					{#if capacity}
						<figcaption>
							{capacity.label} <strong {...capacity.attributes}>{capacity.text}</strong>
						</figcaption>
					{/if}
					<img
						src={openCooker}
						alt={th
							? 'หม้อหุงข้าวเปิดฝาให้เห็นข้าวสุกด้านใน'
							: 'Rice cooker with the lid open and cooked rice inside'}
						width="840"
						height="1260"
						loading="lazy"
					/>
				</figure>
				<figure id="cooker-switch">
					<figcaption {...data.summary.attributes}>{data.summary.text}</figcaption>
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
		{:else}
			<p {...data.summary.attributes}>{data.summary.text}</p>
		{/if}
		{#if data.specs.length}
			<h3>{th ? 'ข้อมูลสินค้า' : 'Product information'}</h3>
			<dl class:feature-grid={data.id === 'cooker-one-button'}>
				{#each data.specs as spec (spec.attributes['data-fact'])}
					<div>
						<dt>
							{#if data.id === 'cooker-one-button'}
								<svg
									width="32"
									height="32"
									viewBox="0 0 32 32"
									stroke="currentColor"
									fill="none"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									aria-hidden="true"
								>
									{#if spec.attributes['data-fact'] === 'spec.capacity'}
										<path d="M4 10h24l-3 14H7zM7 26h18M9 13h5m-5 4h3" />
									{:else if spec.attributes['data-fact'] === 'spec.power'}
										<path d="m18 3-12 16h9l-1 10 12-17h-9z" />
									{:else if spec.attributes['data-fact'] === 'spec.programs'}
										<path
											d="M4 15h24M6 16v7q0 3 3 3h14q3 0 3-3v-7M8 12q8-7 16 0M14 8h4M11 6l1-3m6 3 1-3"
										/>
									{:else}
										<path
											d="M16 3c4 3 8 4 11 4v9c0 7-8 11-11 13C12 27 5 23 5 16V7c4 0 8-2 11-4zM11 16l4 4 7-8"
										/>
									{/if}
								</svg>
							{/if}
							{spec.label}
						</dt>
						<dd {...spec.attributes}>{spec.text}</dd>
					</div>
				{/each}
			</dl>
		{/if}
	</div>
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
	figure:nth-child(2) {
		background: #f6f6f4;
	}
	figcaption {
		padding: 1.8em 0.9em 1.25em;
		text-align: center;
		font-size: 1.25em;
		font-weight: 600;
		line-height: 1.35;
		color: #444;
	}
	figcaption.name {
		padding-block-start: 2.5em;
		font-size: 1.55em;
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
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2px;
		max-width: 36rem;
		margin-inline: auto;
	}
	.feature-grid div {
		display: block;
		background: #f6f6f4;
		text-align: center;
		padding: 1.1rem 0.6rem;
	}
	.feature-grid dt {
		display: grid;
		justify-items: center;
		gap: 0.3rem;
	}
	.feature-grid dd {
		font-weight: 700;
	}
</style>
