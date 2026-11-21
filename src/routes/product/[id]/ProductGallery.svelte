<script lang="ts">
	import { flushSync, onMount } from 'svelte';
	import oneButtonOverview from '../../../lib/assets/products/cooker-overview.mp4';
	import digitalOverview from '../../../lib/assets/products/digital-overview.mp4';
	import { digitalMedia } from '../../../lib/assets/products/digital-media';
	import CookerPhotoCaption from '../../../lib/storefront/CookerPhotoCaption.svelte';
	import oneButtonPhoto from '../../../lib/assets/products/cooker-listing-hero.jpg';
	import oneButtonAlternate from '../../../lib/assets/products/cooker-one-button.jpg';

	let {
		th,
		productId = 'cooker-one-button'
	}: { th: boolean; productId?: 'cooker-one-button' | 'cooker-digital' } = $props();
	const digital = $derived(productId === 'cooker-digital');
	const overview = $derived(digital ? digitalOverview : oneButtonOverview);
	const mainPhoto = $derived(digital ? digitalMedia.hero : oneButtonPhoto);
	const alternatePhoto = $derived(digital ? digitalMedia.intro : oneButtonAlternate);
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
		if (digital) {
			// The finite local image set stays available if connectivity drops mid-listing.
			for (const src of new Set(Object.values(digitalMedia))) {
				void fetch(src, { signal: controller.signal, cache: 'force-cache' }).catch(() => {});
			}
		}
		return () => {
			controller.abort();
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	});
	let playbackSource = $state('');
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

<div class="gallery relative h-full" role="region" aria-label={th ? 'รูปสินค้า' : 'Product photos'}>
	{#if watching}
		<div class="player size-full">
			<video
				class="block size-full bg-[#16161a] object-contain"
				src={playbackSource}
				poster={mainPhoto}
				controls
				playsinline
				muted
				bind:this={video}
				aria-label={th ? 'วิดีโอแสดงหม้อหุงข้าวจากมุมต่าง ๆ' : 'Rice cooker overview video'}
			></video>
			<button
				class="close absolute end-2 top-16 grid size-[var(--tap,44px)] cursor-pointer place-items-center rounded-[50%] border border-[rgb(255_255_255/80%)] bg-[rgb(22_22_26/78%)] text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-current focus-visible:outline-solid"
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
			class="photos flex h-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overflow-y-hidden overscroll-x-contain"
			bind:this={strip}
			onscroll={(event) => {
				const { scrollLeft, clientWidth } = event.currentTarget;
				active = Math.round(scrollLeft / clientWidth);
			}}
		>
			{#each photos as photo, index (photo.src)}
				<div class="slide relative h-full flex-[0_0_100%] snap-start">
					<img
						class="size-full snap-start object-cover"
						src={photo.src}
						alt={photo.alt}
						draggable="false"
					/>{#if index === 0}<CookerPhotoCaption {productId} locale={th ? 'th' : 'en'} />{/if}
				</div>
			{/each}
		</div>
		{#if active === 0}
			<button
				class="play absolute top-1/2 left-1/2 grid size-[68px] [transform:translate(-50%,-50%)] cursor-pointer place-items-center rounded-[50%] border border-[rgb(255_255_255/80%)] bg-[rgb(22_22_26/78%)] text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-current focus-visible:outline-solid"
				type="button"
				bind:this={playControl}
				onclick={openVideo}
				aria-label={th ? 'เล่นวิดีโอแนะนำหม้อหุงข้าว' : 'Play rice cooker overview'}
			>
				<svg
					class="ms-[3px]"
					width="27"
					height="27"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<path d="M6 3.5v17l14-8.5z" />
				</svg>
			</button>
		{/if}
		<div class="controls absolute end-2 bottom-2 flex rounded-[24px] bg-white">
			{#each photos as photo, index (photo.src)}
				<button
					class="grid size-[var(--tap,44px)] cursor-pointer place-items-center rounded-[24px] bg-transparent text-[#16161a] [border:0] after:size-2.5 after:rounded-[50%] after:border after:border-current after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-current focus-visible:outline-solid aria-pressed:after:bg-current"
					type="button"
					aria-label={photo.label}
					aria-pressed={index === active}
					onclick={() => strip?.scrollTo(index * strip.clientWidth, 0)}
				></button>
			{/each}
		</div>
	{/if}
</div>
