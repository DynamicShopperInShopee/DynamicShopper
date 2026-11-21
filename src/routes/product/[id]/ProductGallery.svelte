<script lang="ts">
	import { flushSync, onMount } from 'svelte';
	import overview from '../../../lib/assets/products/cooker-overview.mp4';
	import CookerPhotoCaption from '../../../lib/storefront/CookerPhotoCaption.svelte';
	import mainPhoto from '../../../lib/assets/products/cooker-listing-hero.jpg';
	import alternatePhoto from '../../../lib/assets/products/cooker-one-button.jpg';

	let { th }: { th: boolean } = $props();
	let strip = $state<HTMLDivElement>();
	let active = $state(0);
	let watching = $state(false);
	let video = $state<HTMLVideoElement>();
	let localVideo = $state<string>();
	onMount(() => {
		const controller = new AbortController();
		let objectUrl: string | undefined;
		// Keep the small catalog clip playable if connectivity drops after the listing loads.
		async function cacheClip() {
			try {
				const response = await fetch(overview, { signal: controller.signal });
				if (!response.ok) return;
				const clip = await response.blob();
				if (controller.signal.aborted) return;
				objectUrl = URL.createObjectURL(clip);
				localVideo = objectUrl;
			} catch {
				// Native playback can still request the bundled file when connected.
			}
		}
		void cacheClip();
		return () => {
			controller.abort();
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	});
	let playbackSource = $state(overview);
	let playControl = $state<HTMLButtonElement>();
	let closeControl = $state<HTMLButtonElement>();

	function openVideo() {
		playbackSource = localVideo ?? overview;
		flushSync(() => {
			watching = true;
		});
		closeControl?.focus({ preventScroll: true });
		// The native controls also allow starting playback when the browser declines this request.
		void video?.play().catch(() => {});
	}

	function closeVideo() {
		flushSync(() => {
			watching = false;
		});
		playControl?.focus({ preventScroll: true });
	}
	const photos = $derived([
		{
			src: mainPhoto,
			label: th ? 'รูปหลัก' : 'Main photo',
			alt: th ? 'หม้อหุงข้าวสีขาวบนพื้นหลังสีน้ำเงิน' : 'White rice cooker against a blue backdrop'
		},
		{
			src: alternatePhoto,
			label: th ? 'รูปอีกมุม' : 'Alternate photo',
			alt: th ? 'หม้อหุงข้าวบนเคาน์เตอร์ครัว' : 'Rice cooker on a kitchen counter'
		}
	]);
</script>

<div class="gallery" role="region" aria-label={th ? 'รูปสินค้า' : 'Product photos'}>
	{#if watching}
		<div class="player">
			<video
				src={playbackSource}
				poster={mainPhoto}
				controls
				playsinline
				muted
				bind:this={video}
				aria-label={th ? 'วิดีโอแสดงหม้อหุงข้าวจากมุมต่าง ๆ' : 'Rice cooker overview video'}
			></video>
			<button
				class="close"
				type="button"
				bind:this={closeControl}
				onclick={closeVideo}
				aria-label={th ? 'ปิดวิดีโอและกลับไปดูรูป' : 'Close video and return to photos'}
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path d="m6 6 12 12M18 6 6 18" />
				</svg>
			</button>
		</div>
	{:else}
		<div
			class="photos"
			bind:this={strip}
			onscroll={(event) => {
				const { scrollLeft, clientWidth } = event.currentTarget;
				active = Math.round(scrollLeft / clientWidth);
			}}
		>
			{#each photos as photo, index (photo.src)}
				<div class="slide">
					<img
						src={photo.src}
						alt={photo.alt}
						draggable="false"
					/>{#if index === 0}<CookerPhotoCaption locale={th ? 'th' : 'en'} />{/if}
				</div>
			{/each}
		</div>
		{#if active === 0}
			<button
				class="play"
				type="button"
				bind:this={playControl}
				onclick={openVideo}
				aria-label={th ? 'เล่นวิดีโอแนะนำหม้อหุงข้าว' : 'Play rice cooker overview'}
			>
				<svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M6 3.5v17l14-8.5z" />
				</svg>
			</button>
		{/if}
		<div class="controls">
			{#each photos as photo, index (photo.src)}
				<button
					type="button"
					aria-label={photo.label}
					aria-pressed={index === active}
					onclick={() => strip?.scrollTo(index * strip.clientWidth, 0)}
				></button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.gallery {
		position: relative;
		height: 100%;
	}
	.photos {
		display: flex;
		height: 100%;
		overflow: auto hidden;
		overscroll-behavior-x: contain;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}
	.slide {
		position: relative;
		flex: 0 0 100%;
		height: 100%;
		scroll-snap-align: start;
	}
	.photos img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		scroll-snap-align: start;
	}
	.controls {
		position: absolute;
		inset-inline-end: 8px;
		bottom: 8px;
		display: flex;
		border-radius: 24px;
		background: white;
	}
	button {
		display: grid;
		place-items: center;
		width: var(--tap, 44px);
		height: var(--tap, 44px);
		border: 0;
		border-radius: 24px;
		background: transparent;
		color: #16161a;
		cursor: pointer;
	}
	.controls button::after {
		content: '';
		width: 10px;
		height: 10px;
		border: 1px solid currentColor;
		border-radius: 50%;
	}
	button[aria-pressed='true']::after {
		background: currentColor;
	}
	button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: -4px;
	}
	.play,
	.close {
		position: absolute;
		color: white;
		background: rgb(22 22 26 / 78%);
		border: 1px solid rgb(255 255 255 / 80%);
		border-radius: 50%;
	}
	.play {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 68px;
		height: 68px;
	}
	.play svg {
		margin-inline-start: 3px;
	}
	.player,
	video {
		width: 100%;
		height: 100%;
	}
	video {
		display: block;
		object-fit: contain;
		background: #16161a;
	}
	.close {
		top: 64px;
		inset-inline-end: 8px;
	}
</style>
