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
		controls: { src: digitalMedia.controls, anchor: 'digital-preset' },
		serving: { src: digitalMedia.serving, anchor: 'digital-serving' }
	};
</script>

{#if items.length}
	<section
		class={[
			'mb-[0.75em] rounded bg-[#f6f6f6] p-[0.8em] [&.excerpt]:mx-0 [&.excerpt]:mt-[0.8em] [&.excerpt]:mb-0 [&.excerpt]:bg-transparent [&.excerpt]:p-0'
		]}
		class:excerpt={!!reviewField}
		aria-label={reviewField
			? th
				? 'ภาพประกอบรีวิวจำลองนี้'
				: 'Images for this simulated review'
			: th
				? 'สื่อรีวิวจำลอง'
				: 'Simulated review media'}
	>
		{#if !reviewField}<h3 class="mx-0 mt-0 mb-[0.65em] text-[1em] font-semibold">
				{th ? 'ภาพรีวิวจำลอง' : 'Simulated review photos'}
			</h3>{/if}
		<div class="photos grid max-w-lg grid-cols-3 gap-[0.45em]">
			{#each items as item (item.mediaId)}
				<a
					class="overflow-hidden rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current focus-visible:outline-solid"
					href={'#' + scenes[item.mediaId].anchor}
					aria-label={item.caption.text}
				>
					<img
						class="block aspect-square h-auto w-full object-cover object-bottom"
						src={scenes[item.mediaId].src}
						alt=""
						width="160"
						height="160"
						loading="lazy"
					/>
					<span class="visually-hidden sr-only" {...item.caption.attributes}>
						{item.caption.text}
					</span>
				</a>
			{/each}
		</div>
	</section>
{/if}
