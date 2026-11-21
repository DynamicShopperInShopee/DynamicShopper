<script lang="ts">
	import type { PageData } from './$types';
	import { digitalMedia } from '../../../lib/assets/products/digital-media';
	let { data, reviewField }: { data: PageData; reviewField?: string } = $props();
	const th = $derived(data.language === 'th');
	const items = $derived(
		data.listingDetails?.reviewMedia.filter(
			(item) => !reviewField || item.reviewField === reviewField
		) ?? []
	);
	const scenes = {
		rice: { src: digitalMedia.pot, anchor: 'digital-nonstick' },
		controls: { src: digitalMedia.intro, anchor: 'digital-intro' },
		serving: { src: digitalMedia.serving, anchor: 'digital-serving' }
	};
</script>

{#if items.length}
	<section
		class:excerpt={!!reviewField}
		aria-label={reviewField
			? th
				? 'ภาพประกอบรีวิวจำลองนี้'
				: 'Images for this simulated review'
			: th
				? 'สื่อรีวิวจำลอง'
				: 'Simulated review media'}
	>
		{#if !reviewField}
			<h3>{th ? 'สรุปจากข้อมูลสินค้า' : 'From the listing'}</h3>
			<p class="summary" {...data.summary.attributes}>{data.summary.text}</p>
			<p class="media-label">{th ? 'ภาพรีวิวจำลอง' : 'Simulated review photos'}</p>
		{/if}
		<div class="photos">
			{#each items as item (item.mediaId)}
				<a href={'#' + scenes[item.mediaId].anchor} aria-label={item.caption.text}>
					<img src={scenes[item.mediaId].src} alt="" width="160" height="160" loading="lazy" />
					<span class="visually-hidden" {...item.caption.attributes}>{item.caption.text}</span>
				</a>
			{/each}
		</div>
	</section>
{/if}

<style>
	section {
		padding: 0.8em;
		background: #f6f6f6;
		border-radius: 4px;
		margin-bottom: 0.75em;
	}
	section.excerpt {
		padding: 0;
		background: transparent;
		margin: 0.8em 0 0;
	}
	h3 {
		font-size: 1em;
		font-weight: 600;
		margin: 0 0 0.65em;
	}
	.summary {
		margin: 0 0 0.8em;
		line-height: 1.55;
	}
	.media-label {
		margin: 0 0 0.5em;
		color: #5d5d63;
		font-size: 0.8em;
	}
	:global(main[data-theme='large']) .media-label {
		font-size: 1em;
	}
	.photos {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.45em;
		max-width: 32rem;
	}
	a {
		border-radius: 4px;
		overflow: hidden;
	}
	a:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 1;
		object-fit: cover;
		object-position: center bottom;
	}
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
