<script lang="ts">
	import type { PageData } from './$types';
	import introCooker from '../../../lib/assets/products/cooker-intro.jpg';
	import ProductSpecificationTiles from './ProductSpecificationTiles.svelte';
	import DigitalCookerDescription from './DigitalCookerDescription.svelte';
	import servingCooker from '../../../lib/assets/products/cooker-serving.jpg';
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

<section
	class="scroll-mt-16 border-t-8 border-[var(--seam,#f2f2f2)]"
	id="details"
	aria-labelledby="details-title"
>
	{#if data.specs.length}
		<button
			type="button"
			class="attributes grid min-h-[var(--tap,44px)] w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[0.55em] border-b border-[var(--seam,#e9e6dc)] bg-white px-[0.8rem] py-[0.75em] text-inherit [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--accent,#16161a)] focus-visible:outline-solid"
			aria-label={th ? 'ดูคุณลักษณะสินค้า' : 'View attributes'}
			aria-controls="product-specifications"
			aria-haspopup="dialog"
			disabled={!openSpecifications}
			onclick={(event) => openSpecifications?.(event.currentTarget)}
		>
			<strong class="font-semibold">{th ? 'คุณลักษณะ' : 'Attributes'}</strong>
			<span class="truncate text-right text-[#565656]">
				{data.specs.map((spec) => spec.label).join(', ')}
			</span>
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
	<div class="body px-[0.8rem] pt-[0.85rem] pb-[1.6rem] min-[700px]:mx-auto min-[700px]:max-w-4xl">
		<h2 class="mx-0 mt-0 mb-[0.75em] text-[1em] font-semibold" id="details-title">
			{th ? 'รายละเอียดสินค้า' : 'Product details'}
		</h2>
		{#if data.listingDetails}
			<DigitalCookerDescription {data} details={data.listingDetails} />
		{:else if data.id === 'cooker-one-button'}
			<div class="story mx-auto max-w-[38rem]">
				<figure class="relative m-0 scroll-mt-16 bg-[#efeeed]" id="cooker-exterior">
					<figcaption
						class="intro-caption absolute inset-x-[5%] top-[6%] p-0 text-start text-[1.25em] leading-[1.35] font-semibold text-[#444]"
					>
						<h3
							class="m-0 text-[max(1.5rem,var(--action-font-floor,0rem))] leading-[1.35] font-semibold"
							{...data.name.attributes}
						>
							{data.name.text}
						</h3>
						<p
							{...data.summary.attributes}
							class="mt-[1.2rem] border-t border-[#858172] pt-4 text-[max(1rem,var(--action-font-floor,0rem))] leading-normal font-normal"
						>
							{data.summary.text}
						</p>
					</figcaption>
					<img
						class="block h-auto w-full"
						src={introCooker}
						alt={th ? 'หม้อหุงข้าวสีขาวบนเคาน์เตอร์ครัว' : 'White rice cooker on a kitchen counter'}
						width="700"
						height="1050"
						loading="lazy"
					/>
				</figure>
				<ProductSpecificationTiles specs={data.specs} {th} />
				<figure class="relative m-0 scroll-mt-16 bg-[#f6f6f4]" id="cooker-capacity">
					{#if capacity}
						<figcaption
							class="capacity-caption absolute inset-x-[5%] top-[4%] p-0 text-center text-[1.25em] leading-[1.35] font-semibold text-[#444]"
						>
							{capacity.label}
							<strong
								class="font-[family-name:var(--product-figure-font)]"
								{...capacity.attributes}
							>
								{capacity.text}
							</strong>
						</figcaption>
					{/if}
					<img
						class="block h-auto w-full"
						src={servingCooker}
						alt={th
							? 'คนตักข้าวใส่ถ้วยข้างหม้อหุงข้าวที่เปิดฝา'
							: 'A person serving rice beside the open cooker'}
						width="700"
						height="1050"
						loading="lazy"
					/>
				</figure>
				<figure class="m-0 scroll-mt-16 bg-[#efeeed]" id="cooker-switch">
					<figcaption
						class="px-[0.9em] pt-[1.8em] pb-[1.25em] text-center text-[1.25em] leading-[1.35] font-semibold text-[#444]"
					>
						{th ? 'สวิตช์ด้านหน้า' : 'Front switch'}
					</figcaption>
					<img
						class="block h-auto w-full"
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
		{#if data.specs.length && !data.listingDetails}
			<h3 class="mx-0 mt-[1.3em] mb-[0.4em] text-[1em] font-semibold">
				{th ? 'จุดเด่น' : 'Highlights'}
			</h3>
			<p class="text-summary mx-0 mt-0 mb-4 leading-[1.6] text-[#555]" {...data.summary.attributes}>
				{data.summary.text}
			</p>
			<h3 class="mx-0 mt-[1.3em] mb-[0.4em] text-[1em] font-semibold">
				{th ? 'ข้อมูลสินค้า' : 'Product information'}
			</h3>
			<dl class="information m-0 text-[#555]">
				<div class="grid grid-cols-[minmax(6rem,36%)_1fr] gap-[0.7em] py-[0.4em] leading-normal">
					<dt>{th ? 'สินค้า' : 'Product'}</dt>
					<dd
						class={[
							'm-0 [font-family:inherit] [&.figure]:font-[family-name:var(--product-figure-font)]'
						]}
						{...data.name.attributes}
					>
						{data.name.text}
					</dd>
				</div>
				{#if data.shop}
					<div class="grid grid-cols-[minmax(6rem,36%)_1fr] gap-[0.7em] py-[0.4em] leading-normal">
						<dt>{th ? 'ร้านค้า' : 'Seller'}</dt>
						<dd
							class={[
								'm-0 [font-family:inherit] [&.figure]:font-[family-name:var(--product-figure-font)]'
							]}
							{...data.shop.attributes}
						>
							{data.shop.text}
						</dd>
					</div>
				{/if}
				{#each data.specs as spec (spec.attributes['data-fact'])}
					<div class="grid grid-cols-[minmax(6rem,36%)_1fr] gap-[0.7em] py-[0.4em] leading-normal">
						<dt>{spec.label}</dt>
						<dd
							class={[
								'm-0 [font-family:inherit] [&.figure]:font-[family-name:var(--product-figure-font)]'
							]}
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
</section>
