<script lang="ts">
	import type { PageData } from './$types';
	import closedCooker from '../../../lib/assets/products/cooker-intro.jpg';
	import openCooker from '../../../lib/assets/products/cooker-open-detail.jpg';
	import servingCooker from '../../../lib/assets/products/cooker-serving.jpg';
	import cookerSwitch from '../../../lib/assets/products/cooker-switch-detail.jpg';
	import overview from '../../../lib/assets/products/cooker-overview.mp4';
	import DigitalReviewMedia from './DigitalReviewMedia.svelte';
	import DigitalReviewVideos from './DigitalReviewVideos.svelte';
	const illustrations = [
		{ id: 'cooker-exterior', src: closedCooker, en: 'Cooker exterior', th: 'ตัวหม้อหุงข้าว' },
		{ id: 'cooker-capacity', src: servingCooker, en: 'Serving rice', th: 'การตักข้าว' },
		{ id: 'cooker-switch', src: cookerSwitch, en: 'Front switch', th: 'สวิตช์ด้านหน้า' }
	];

	let { data }: { data: PageData } = $props();
	const th = $derived(data.language === 'th');
	let search = $state('');
	let showVideo = $state(false);
	const matches = $derived(
		data.reviews.filter((review) =>
			review.text
				.toLocaleLowerCase(data.language)
				.includes(search.trim().toLocaleLowerCase(data.language))
		)
	);
	function playVideo(player: HTMLVideoElement) {
		player.focus({ preventScroll: true });
		player.play().catch(() => {
			/* Native controls remain available when playback needs another tap. */
		});
	}
</script>

<section
	class="scroll-mt-16 border-t-8 border-[var(--seam,#f2f2f2)] px-[0.8rem]"
	id="reviews"
	aria-label={th ? 'รีวิวสินค้า' : 'Product reviews'}
>
	<h2
		class="m-0 flex flex-wrap items-center gap-[0.35em] pt-[1em] pb-[0.8em] text-[1em] font-semibold"
		id="reviews-title"
	>
		<strong
			class="font-[family-name:var(--product-figure-font)] text-[1.45em] leading-[1.1]"
			{...data.rating.attributes}
		>
			{data.rating.text}
		</strong>
		<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
			<path d="m10 1.8 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" />
		</svg>
		{th ? 'คะแนนสินค้า' : 'Product rating'}
		<small class="text-[max(0.875rem,var(--action-font-floor,0rem))] font-normal text-[#555]">
			(<span class="font-[family-name:var(--product-figure-font)]" {...data.reviewCount.attributes}>
				{data.reviewCount.text}
			</span>
			{th ? 'รีวิว' : 'reviews'})
		</small>
	</h2>
	{#if data.listingDetails}
		<DigitalReviewMedia {data} />
	{:else if data.id === 'cooker-one-button'}
		<aside class="mb-[0.75em] rounded bg-[#f6f6f6] p-[0.8em]" aria-labelledby="listing-photo-label">
			<h3 class="mx-0 mt-0 mb-[0.65em] text-[1em] font-semibold" id="listing-photo-label">
				{th ? 'ภาพจากหน้าสินค้า' : 'Photos from the listing'}
			</h3>
			<p class="listing-summary mx-0 mt-0 mb-[0.75em] leading-[1.55]" {...data.summary.attributes}>
				{data.summary.text}
			</p>
			<div class="thumbnails grid max-w-lg grid-cols-3 gap-[0.45em]">
				{#each illustrations as item (item.id)}
					<a
						class="group/thumbnail block overflow-hidden rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)] focus-visible:outline-solid"
						href={'#' + item.id}
					>
						<img
							class="block aspect-square h-auto w-full object-cover group-[[href='#cooker-capacity']]/thumbnail:object-bottom group-[[href='#cooker-exterior']]/thumbnail:object-bottom"
							src={item.src}
							width="160"
							height="160"
							alt={th ? item.th : item.en}
							loading="lazy"
						/>
					</a>
				{/each}
			</div>
		</aside>
	{/if}
	<label
		class="review-search flex items-center gap-[0.5em] rounded border border-[#aaa] px-[0.65rem] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent,#16161a)] focus-within:outline-solid"
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width="18"
			height="18"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" />
		</svg>
		<input
			class="min-h-[var(--tap,44px)] min-w-0 flex-1 bg-transparent text-inherit [font:inherit]"
			type="search"
			aria-label={th ? 'ค้นหาในรีวิว' : 'Search product reviews'}
			placeholder={data.listingDetails
				? th
					? 'ค้นหารีวิวจำลอง'
					: 'Search simulated reviews'
				: th
					? 'ค้นหารีวิวจากผู้ซื้อคนอื่น'
					: 'Search buyer reviews'}
			bind:value={search}
		/>
	</label>
	<ul class="mx-0 mt-[0.75em] mb-0 list-none p-0" aria-live="polite">
		{#each matches as review (review.attributes['data-fact'])}
			<li class="border-t border-[var(--seam,#e9e6dc)] pt-[0.9em] pb-[1em]">
				<div
					class="byline flex items-center gap-[0.5em] text-[max(0.875rem,var(--action-font-floor,0rem))] font-semibold text-[#555]"
				>
					<svg
						class="rounded-[50%] bg-[#f3f3f3]"
						aria-hidden="true"
						viewBox="0 0 24 24"
						width="22"
						height="22"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<circle cx="12" cy="9" r="3.3" /><path d="M5 20c0-7.5 14-7.5 14 0" />
					</svg>
					{data.listingDetails
						? th
							? 'รีวิวจำลอง'
							: 'Simulated review'
						: th
							? 'รีวิวจากผู้ซื้อ'
							: 'Buyer review'}
				</div>
				<blockquote class="mx-0 mt-[0.5em] mb-0 leading-[1.55]" {...review.attributes}>
					{review.text}
				</blockquote>
				{#if data.listingDetails}
					<DigitalReviewMedia {data} reviewField={review.attributes['data-fact']} />
				{/if}
			</li>
		{:else}
			<li class="border-t border-[var(--seam,#e9e6dc)] pt-[0.9em] pb-[1em]">
				{th ? 'ไม่พบรีวิวที่ตรงกับคำค้น' : 'No reviews match your search.'}
			</li>
		{/each}
	</ul>
</section>

{#if data.listingDetails}
	{#key data.id}<DigitalReviewVideos {data} />{/key}
{:else if data.id === 'cooker-one-button'}
	<section
		class="media scroll-mt-16 border-t-8 border-[var(--seam,#f2f2f2)] px-[0.8rem] pb-[1em]"
		aria-labelledby="listing-video-title"
	>
		<h3 class="pt-[0.9em] pb-[0.65em] text-[1em] font-semibold" id="listing-video-title">
			{th ? 'วิดีโอจากหน้าสินค้า' : 'Video from the listing'}
		</h3>
		{#if showVideo}
			<video
				class="block aspect-square w-[min(100%,25rem)] bg-[#16161a]"
				src={overview}
				poster={openCooker}
				controls
				muted
				playsinline
				preload="metadata"
				aria-label={th ? 'วิดีโอแนะนำหม้อหุงข้าว' : 'Rice cooker overview'}
				use:playVideo
			></video>
		{:else}
			<button
				class="video-poster relative block w-[clamp(7.5rem,31vw,11.25rem)] cursor-pointer overflow-hidden rounded p-0 text-white [border:0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)] focus-visible:outline-solid"
				type="button"
				aria-label={th ? 'ดูวิดีโอแนะนำสินค้า' : 'Watch listing video'}
				onclick={() => (showVideo = true)}
			>
				<img
					class="aspect-[4/5] h-auto w-full object-cover"
					src={openCooker}
					alt=""
					width="160"
					height="192"
					loading="lazy"
				/>
				<span
					class="absolute top-1/2 left-1/2 grid size-[2.25em] [transform:translate(-50%,-50%)] place-items-center rounded-[50%] bg-[rgb(0_0_0/70%)]"
					aria-hidden="true"
				>
					<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
						<path d="m4 2 12 7-12 7z" />
					</svg>
				</span>
			</button>
		{/if}
	</section>
{/if}
