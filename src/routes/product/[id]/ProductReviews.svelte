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

<section id="reviews" aria-label={th ? 'รีวิวสินค้า' : 'Product reviews'}>
	<h2 id="reviews-title">
		<strong {...data.rating.attributes}>{data.rating.text}</strong>
		<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
			<path d="m10 1.8 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" />
		</svg>
		{th ? 'คะแนนสินค้า' : 'Product rating'}
		<small>
			(<span {...data.reviewCount.attributes}>{data.reviewCount.text}</span>
			{th ? 'รีวิว' : 'reviews'})
		</small>
	</h2>
	{#if data.listingDetails}
		<DigitalReviewMedia {data} />
	{:else if data.id === 'cooker-one-button'}
		<aside aria-labelledby="listing-photo-label">
			<h3 id="listing-photo-label">{th ? 'ภาพจากหน้าสินค้า' : 'Photos from the listing'}</h3>
			<p class="listing-summary" {...data.summary.attributes}>{data.summary.text}</p>
			<div class="thumbnails">
				{#each illustrations as item (item.id)}
					<a href={'#' + item.id}>
						<img
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
	<label class="review-search">
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
	<ul aria-live="polite">
		{#each matches as review (review.attributes['data-fact'])}
			<li>
				<div class="byline">
					<svg
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
				<blockquote {...review.attributes}>{review.text}</blockquote>
				{#if data.listingDetails}
					<DigitalReviewMedia {data} reviewField={review.attributes['data-fact']} />
				{/if}
			</li>
		{:else}
			<li>{th ? 'ไม่พบรีวิวที่ตรงกับคำค้น' : 'No reviews match your search.'}</li>
		{/each}
	</ul>
</section>

{#if data.listingDetails}
	{#key data.id}<DigitalReviewVideos {data} />{/key}
{:else if data.id === 'cooker-one-button'}
	<section class="media" aria-labelledby="listing-video-title">
		<h3 id="listing-video-title">{th ? 'วิดีโอจากหน้าสินค้า' : 'Video from the listing'}</h3>
		{#if showVideo}
			<video
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
				class="video-poster"
				type="button"
				aria-label={th ? 'ดูวิดีโอแนะนำสินค้า' : 'Watch listing video'}
				onclick={() => (showVideo = true)}
			>
				<img src={openCooker} alt="" width="160" height="192" loading="lazy" />
				<span aria-hidden="true">
					<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
						<path d="m4 2 12 7-12 7z" />
					</svg>
				</span>
			</button>
		{/if}
	</section>
{/if}

<style>
	section {
		scroll-margin-top: 4rem;
		border-top: 8px solid var(--seam, #f2f2f2);
		padding: 0 0.8rem;
	}
	h2 {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35em;
		margin: 0;
		padding: 1em 0 0.8em;
		font-size: 1em;
		font-weight: 600;
	}
	h2 strong {
		font-size: 1.45em;
		line-height: 1.1;
	}
	h2 strong,
	small span {
		font-family: var(--product-figure-font);
	}
	small,
	.byline {
		font-size: max(0.875rem, var(--action-font-floor, 0rem));
		color: #555;
		font-weight: 400;
	}
	aside {
		padding: 0.8em;
		background: #f6f6f6;
		border-radius: 4px;
		margin-bottom: 0.75em;
	}
	aside h3 {
		font-size: 1em;
		font-weight: 600;
		margin: 0 0 0.65em;
	}
	.listing-summary {
		margin: 0 0 0.75em;
		line-height: 1.55;
	}
	.media {
		padding-bottom: 1em;
	}
	.media h3 {
		font-size: 1em;
		font-weight: 600;
		padding: 0.9em 0 0.65em;
	}
	.video-poster {
		position: relative;
		display: block;
		width: clamp(7.5rem, 31vw, 11.25rem);
		padding: 0;
		border: 0;
		border-radius: 4px;
		overflow: hidden;
		color: white;
		cursor: pointer;
	}
	.video-poster img {
		width: 100%;
		height: auto;
		aspect-ratio: 4 / 5;
		object-fit: cover;
	}
	.video-poster span {
		display: grid;
		place-items: center;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 2.25em;
		height: 2.25em;
		border-radius: 50%;
		background: rgb(0 0 0 / 70%);
	}
	.video-poster:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: 2px;
	}
	.media video {
		display: block;
		width: min(100%, 25rem);
		aspect-ratio: 1;
		background: #16161a;
	}
	.thumbnails {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.45em;
		max-width: 32rem;
	}
	.thumbnails a {
		display: block;
		border-radius: 4px;
		overflow: hidden;
	}
	.thumbnails a:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: 2px;
	}
	.thumbnails img {
		width: 100%;
		height: auto;
		aspect-ratio: 1;
		object-fit: cover;
		display: block;
	}
	.thumbnails a[href='#cooker-exterior'] img,
	.thumbnails a[href='#cooker-capacity'] img {
		object-position: center bottom;
	}
	.review-search {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding-inline: 0.65rem;
		border: 1px solid #aaa;
		border-radius: 4px;
	}
	input {
		min-width: 0;
		min-height: var(--tap, 44px);
		flex: 1;
		font: inherit;
		color: inherit;
		background: transparent;
	}
	.review-search:focus-within {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: 2px;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0.75em 0 0;
	}
	li {
		border-top: 1px solid var(--seam, #e9e6dc);
		padding: 0.9em 0 1em;
	}
	.byline {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-weight: 600;
	}
	.byline svg {
		border-radius: 50%;
		background: #f3f3f3;
	}
	blockquote {
		margin: 0.5em 0 0;
		line-height: 1.55;
	}
</style>
