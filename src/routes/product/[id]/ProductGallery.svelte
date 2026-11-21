<script lang="ts">
	import mainPhoto from '../../../lib/assets/products/cooker-listing-hero.jpg';
	import alternatePhoto from '../../../lib/assets/products/cooker-one-button.jpg';

	let { th }: { th: boolean } = $props();
	let strip = $state<HTMLDivElement>();
	let active = $state(0);
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
	<div
		class="photos"
		bind:this={strip}
		onscroll={(event) => {
			const { scrollLeft, clientWidth } = event.currentTarget;
			active = Math.round(scrollLeft / clientWidth);
		}}
	>
		{#each photos as photo (photo.src)}
			<img src={photo.src} alt={photo.alt} draggable="false" />
		{/each}
	</div>
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
	.photos img {
		flex: 0 0 100%;
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
	button::after {
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
</style>
