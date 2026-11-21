<script lang="ts">
	import type { PageData } from './$types';
	import { digitalMedia } from '../../../lib/assets/products/digital-media';
	import DigitalCookerModes from './DigitalCookerModes.svelte';
	import DigitalCookerPhoto from './DigitalCookerPhoto.svelte';
	import DigitalCookerPackage from './DigitalCookerPackage.svelte';
	import ListingFactRows from './ListingFactRows.svelte';

	let { data, details }: { data: PageData; details: NonNullable<PageData['listingDetails']> } =
		$props();

	const th = $derived(data.language === 'th');
	const rows = $derived(
		new Map([...data.specs, ...details.features].map((row) => [row.attributes['data-fact'], row]))
	);
	const information = $derived([
		{ label: th ? 'สินค้า' : 'Product', ...data.name },
		...(data.shop ? [{ label: th ? 'ร้านค้า' : 'Seller', ...data.shop }] : []),
		...data.specs,
		...details.technical
	]);
</script>

<div class="digital-description mx-auto flex max-w-[38rem] flex-col gap-7 [--detail-muted:#5d5d63] [--detail-seam:var(--seam,#e9e6dc)] group-data-[theme=vibrant]/listing:[--detail-muted:#4f5068] group-data-[theme=large]/listing:[--detail-muted:#3d3d42] group-data-[theme=large]/listing:[--detail-seam:#858172]" id="digital-description">
	<p class="media-note mx-0 mt-0 -mb-5 text-[var(--detail-muted)]">{th ? 'ภาพประกอบจำลอง' : 'Simulated product illustrations'}</p>
	<DigitalCookerPhoto
		id="digital-intro"
		src={digitalMedia.intro}
		alt={th ? 'หม้อหุงข้าวดิจิทัลบนเคาน์เตอร์ครัว' : 'Digital rice cooker on a kitchen counter'}
		width={700}
		height={1050}
		title={data.name}
		summary={data.summary}
	/>

	<DigitalCookerModes {th} modes={details.modes} programCount={rows.get('spec.programs')} />

	<DigitalCookerPhoto
		id="digital-serving"
		src={digitalMedia.serving}
		alt={th ? 'มือกำลังตักข้าวใส่ถ้วย' : 'A hand serving rice into a bowl'}
		width={700}
		height={1050}
		title={th ? 'ตักข้าวใส่ถ้วย' : 'Serving rice'}
		rows={[rows.get('spec.capacity')]}
	/>

	<DigitalCookerPhoto
		id="digital-preset"
		src={digitalMedia.controls}
		alt={th ? 'แผงควบคุมด้านหน้าหม้อหุงข้าว' : 'The digital cooker’s front controls'}
		width={840}
		height={840}
		title={th ? 'ตั้งเวลาหุง' : 'Cooking timer'}
		rows={[rows.get('detail.presetHours')]}
	>
		{#snippet icon()}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="30"
				height="30"
				viewBox="0 0 32 32"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<circle cx="16" cy="16" r="12" />
				<path d="M16 9v7l5 3m-5-13v1m0 18v1M6 16h1m18 0h1" />
			</svg>
		{/snippet}
	</DigitalCookerPhoto>

	<DigitalCookerPhoto
		id="digital-nonstick"
		src={digitalMedia.pot}
		alt={th
			? 'หม้อหุงข้าวเปิดฝาให้เห็นข้าวสุกในหม้อชั้นใน'
			: 'Cooked rice in the inner pot of the open cooker'}
		width={700}
		height={1050}
		title={th ? 'หม้อชั้นใน' : 'Inner pot'}
		rows={[rows.get('detail.coating')]}
	/>

	<DigitalCookerPhoto
		id="digital-heating"
		src={digitalMedia.heating}
		alt={th
			? 'ภาพตัดขวางของหม้อหุงข้าวและทิศทางความร้อน'
			: 'Cross-section of the cooker showing the direction of heat'}
		width={700}
		height={1050}
		title={th ? 'การกระจายความร้อน' : 'Heat circulation'}
		rows={[rows.get('detail.heatingAngle'), rows.get('detail.warningSeconds')]}
	/>

	<DigitalCookerPhoto
		id="digital-soup"
		src={digitalMedia.soup}
		alt={th ? 'ถ้วยซุปข้างหม้อหุงข้าวที่ปิดฝา' : 'A bowl of soup beside the closed rice cooker'}
		width={700}
		height={1050}
		title={th ? 'เมนูซุป' : 'Making soup'}
	/>

	<DigitalCookerPhoto
		id="digital-warm"
		src={digitalMedia.warm}
		alt={th
			? 'หม้อหุงข้าวปิดฝาบนโต๊ะอาหารข้างคนที่กำลังรับประทานอาหาร'
			: 'A closed rice cooker on a dining table beside a person eating'}
		width={700}
		height={1050}
		title={th ? 'อุ่นข้าวหลังหุง' : 'Rice after cooking'}
		rows={[rows.get('detail.keepWarm')]}
	/>

	<DigitalCookerPhoto
		id="digital-dimensions"
		src={digitalMedia.dimensions}
		alt={th ? 'ภาพแสดงแนววัดขนาดของหม้อหุงข้าว' : 'Diagram showing where the cooker is measured'}
		width={840}
		height={840}
		title={th ? 'ขนาดเครื่อง' : 'Dimensions'}
		rows={details.dimensions}
	>
		{#snippet overlay()}
			<svg
				viewBox="0 0 840 840"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M135 768h452m-438-10-14 10 14 10m424-20 14 10-14 10" />
				<path d="m615 754 104-117m-120 111 16 6 1-19m85-95 18-3-1 18" />
				<path d="M757 132v585m-10-571 10-14 10 14m-20 557 10 14 10-14" />
			</svg>
		{/snippet}
	</DigitalCookerPhoto>

	<DigitalCookerPackage
		{th}
		items={details.packageItems}
		count={details.packageCount}
		src={digitalMedia.kit}
	/>

	{#if details.highlights.length}
		<section aria-labelledby="digital-highlights-title">
			<h3 class="mx-0 mt-0 mb-[0.45em] text-[1.25em] font-semibold" id="digital-highlights-title">{th ? 'จุดเด่น' : 'Highlights'}</h3>
			<ul class="highlights m-0 ps-[1.3em] leading-[1.55]">
				{#each details.highlights as highlight (highlight.attributes['data-fact'])}
					<li  class="[&+li]:mt-[0.4em]"{...highlight.attributes}>{highlight.text}</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section aria-labelledby="digital-information-title">
		<h3 class="mx-0 mt-0 mb-[0.45em] text-[1.25em] font-semibold" id="digital-information-title">{th ? 'ข้อมูลสินค้า' : 'Product information'}</h3>
		<ListingFactRows rows={information} />
	</section>
</div>
