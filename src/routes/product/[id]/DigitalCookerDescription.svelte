<script lang="ts">
	import type { PageData } from './$types';
	import { digitalMedia } from '../../../lib/assets/products/digital-media';
	import DigitalCookerDimensions from './DigitalCookerDimensions.svelte';
	import DigitalCookerModes from './DigitalCookerModes.svelte';
	import DigitalCookerPhoto from './DigitalCookerPhoto.svelte';
	import DigitalCookerPackage from './DigitalCookerPackage.svelte';
	import DigitalCookerTimer from './DigitalCookerTimer.svelte';
	import ListingFactRows from './ListingFactRows.svelte';

	let { data, details }: { data: PageData; details: NonNullable<PageData['listingDetails']> } =
		$props();

	const th = $derived(data.language === 'th');
	const rows = $derived(
		new Map(
			[...data.specs, ...details.features, ...details.dimensions, ...details.technical].map(
				(row) => [row.attributes['data-fact'], row]
			)
		)
	);
	const capacity = $derived(rows.get('spec.capacity'));
	const coating = $derived(rows.get('detail.coating'));
	const heatingAngle = $derived(rows.get('detail.heatingAngle'));
	const warning = $derived(rows.get('detail.warningSeconds'));
	const keepWarm = $derived(rows.get('detail.keepWarm'));
	const dimensionPanel = $derived(
		[
			'detail.model',
			'spec.capacity',
			'detail.voltage',
			'spec.power',
			'detail.weight',
			'detail.type'
		].map((field) => rows.get(field))
	);
	const information = $derived([
		{ label: th ? 'สินค้า' : 'Product', ...data.name },
		...(data.shop ? [{ label: th ? 'ร้านค้า' : 'Seller', ...data.shop }] : []),
		...data.specs,
		...details.dimensions,
		...details.technical
	]);
</script>

<div class="digital-description" id="digital-description">
	<p class="media-note">{th ? 'ภาพประกอบจำลอง' : 'Simulated product illustrations'}</p>
	<DigitalCookerPhoto
		id="digital-intro"
		layout="intro"
		src={digitalMedia.intro}
		alt={th ? 'หม้อหุงข้าวดิจิทัลบนเคาน์เตอร์ครัว' : 'Digital rice cooker on a kitchen counter'}
	>
		{#snippet caption()}
			<h3 class="intro-title" {...data.name.attributes}>{data.name.text}</h3>
			<p class="intro-summary" {...data.summary.attributes}>{data.summary.text}</p>
		{/snippet}
	</DigitalCookerPhoto>

	<DigitalCookerModes {th} modes={details.modes} programCount={rows.get('spec.programs')} />

	<DigitalCookerPhoto
		id="digital-serving"
		layout="serving"
		src={digitalMedia.serving}
		alt={th ? 'มือกำลังตักข้าวใส่ถ้วย' : 'A hand serving rice into a bowl'}
	>
		{#snippet caption()}
			{#if capacity}
				<h3 class="story-title">
					{capacity.label} <span class="figure" {...capacity.attributes}>{capacity.text}</span>
				</h3>
			{/if}
		{/snippet}
	</DigitalCookerPhoto>

	<DigitalCookerTimer {th} timer={rows.get('detail.presetHours')} />

	<DigitalCookerPhoto
		id="digital-nonstick"
		layout="pot"
		src={digitalMedia.pot}
		alt={th
			? 'หม้อหุงข้าวเปิดฝาให้เห็นข้าวสุกในหม้อชั้นใน'
			: 'Cooked rice in the inner pot of the open cooker'}
	>
		{#snippet caption()}
			<h3 class="story-title pot-title">
				{#if th}<span>หม้อชั้นใน</span>{/if}
				{#if coating}<span {...coating.attributes}>{coating.text}</span>{/if}
				{#if !th}<span>inner pot</span>{/if}
			</h3>
		{/snippet}
	</DigitalCookerPhoto>

	<DigitalCookerPhoto
		id="digital-heating"
		layout="cutaway"
		src={digitalMedia.heating}
		alt={th
			? 'ภาพตัดขวางของหม้อหุงข้าวและทิศทางความร้อน'
			: 'Cross-section of the cooker showing the direction of heat'}
	>
		{#snippet caption()}
			<h3 class="story-title">
				{th ? 'การกระจายความร้อน' : 'Heat circulation'}
				{#if heatingAngle}
					<span class="figure" {...heatingAngle.attributes}>{heatingAngle.text}</span>
				{/if}
			</h3>
		{/snippet}
		{#snippet footer()}
			{#if warning}
				<p class="heating-warning">
					{warning.label} <span class="figure" {...warning.attributes}>{warning.text}</span>
				</p>
			{/if}
		{/snippet}
	</DigitalCookerPhoto>

	<DigitalCookerPhoto
		id="digital-soup"
		layout="inset"
		src={digitalMedia.soup}
		alt={th ? 'ถ้วยซุปข้างหม้อหุงข้าวที่ปิดฝา' : 'A bowl of soup beside the closed rice cooker'}
	>
		{#snippet caption()}
			<h3 class="story-title">{th ? 'เมนูซุป' : 'Making soup'}</h3>
		{/snippet}
	</DigitalCookerPhoto>

	<DigitalCookerPhoto
		id="digital-warm"
		layout="inset"
		src={digitalMedia.warm}
		alt={th
			? 'หม้อหุงข้าวปิดฝาบนโต๊ะอาหารข้างคนที่กำลังรับประทานอาหาร'
			: 'A closed rice cooker on a dining table beside a person eating'}
	>
		{#snippet caption()}
			<h3 class="story-title">
				{#if keepWarm}<span {...keepWarm.attributes}>{keepWarm.text}</span>{/if}
			</h3>
		{/snippet}
	</DigitalCookerPhoto>

	<DigitalCookerDimensions
		{th}
		src={digitalMedia.dimensions}
		width={rows.get('detail.width')}
		depth={rows.get('detail.depth')}
		height={rows.get('detail.height')}
		technical={dimensionPanel}
	/>

	<DigitalCookerPackage
		{th}
		items={details.packageItems}
		count={details.packageCount}
		src={digitalMedia.kit}
	/>

	{#if details.highlights.length}
		<section class="plain-section" aria-labelledby="digital-highlights-title">
			<h3 id="digital-highlights-title">{th ? 'จุดเด่น' : 'Highlights'}</h3>
			<ul class="highlights">
				{#each details.highlights as highlight (highlight.attributes['data-fact'])}
					<li {...highlight.attributes}>{highlight.text}</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="plain-section" aria-labelledby="digital-information-title">
		<h3 id="digital-information-title">{th ? 'ข้อมูลสินค้า' : 'Product information'}</h3>
		<ListingFactRows rows={information} />
	</section>
</div>

<style>
	.digital-description {
		--detail-seam: var(--seam, #e9e6dc);
		--detail-muted: #5d5d63;
		--detail-panel: #f3f3f2;
		max-width: 38rem;
		margin-inline: auto;
	}
	:global([data-theme='minimal']) .digital-description {
		--detail-panel: #f7f7f7;
	}
	:global([data-theme='vibrant']) .digital-description {
		--detail-muted: #4f5068;
	}
	:global([data-theme='large']) .digital-description {
		--detail-muted: #3d3d42;
		--detail-seam: #858172;
	}
	.media-note {
		margin: 0 0 0.5em;
		color: var(--detail-muted);
	}
	h3 {
		margin: 0;
		font-size: 1.25em;
		font-weight: 600;
		text-wrap: balance;
	}
	.intro-title,
	.story-title {
		font-size: 1.55em;
		line-height: 1.32;
	}
	.pot-title {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		column-gap: 0.25em;
	}
	.intro-summary {
		max-width: 16em;
		margin: 1.5em 0 0;
		padding-block-start: 0.6em;
		border-top: 1px solid var(--detail-muted);
	}
	:global([data-theme='large']) .intro-summary {
		margin-block-start: 0.75em;
	}
	.figure {
		font-family: var(--product-figure-font);
		white-space: nowrap;
	}
	.heating-warning {
		margin: 0;
		padding: 0.65em 0.5em 0.9em;
		background: var(--detail-panel);
		text-align: center;
		text-wrap: balance;
	}
	.plain-section {
		margin-block-start: 1.45em;
	}
	.plain-section h3 {
		margin-block-end: 0.45em;
	}
	.highlights {
		margin: 0;
		padding-inline-start: 1.3em;
		line-height: 1.55;
		list-style: disc;
	}
	.highlights li + li {
		margin-top: 0.4em;
	}
</style>
