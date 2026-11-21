<script lang="ts">
	import { flushSync, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { digitalMedia } from '../../../lib/assets/products/digital-media';
	import riceVideo from '../../../lib/assets/products/digital-rice.mp4';
	import controlsVideo from '../../../lib/assets/products/digital-overview.mp4';
	import servingVideo from '../../../lib/assets/products/digital-serving.mp4';
	let { data }: { data: PageData } = $props();
	const th = $derived(data.language === 'th');
	const clips = {
		rice: {
			src: riceVideo,
			poster: digitalMedia.pot,
			en: 'Play simulated rice demonstration',
			th: 'เล่นวิดีโอจำลองการหุงข้าว',
			label: { en: 'Rice', th: 'ข้าว' }
		},
		controls: {
			src: controlsVideo,
			poster: digitalMedia.hero,
			en: 'Play simulated cooker overview',
			th: 'เล่นวิดีโอจำลองตัวหม้อ',
			label: { en: 'Cooker overview', th: 'ตัวหม้อ' }
		},
		serving: {
			src: servingVideo,
			poster: digitalMedia.serving,
			en: 'Play simulated serving demonstration',
			th: 'เล่นวิดีโอจำลองการตักข้าว',
			label: { en: 'Serving', th: 'การตักข้าว' }
		}
	};
	type ClipId = keyof typeof clips;
	let localClips = $state<Partial<Record<ClipId, string>>>({});
	let dialog = $state<HTMLDialogElement>();
	let player = $state<HTMLVideoElement>();
	let selected = $state<ClipId>();
	let playbackSource = $state('');
	let trigger: HTMLButtonElement | undefined;
	onMount(() => {
		const controller = new AbortController();
		const urls: string[] = [];
		for (const id of Object.keys(clips) as ClipId[]) {
			void (async () => {
				try {
					const response = await fetch(clips[id].src, { signal: controller.signal });
					if (!response.ok) return;
					const blob = await response.blob();
					if (controller.signal.aborted) return;
					const url = URL.createObjectURL(blob);
					urls.push(url);
					localClips[id] = url;
				} catch {
					/* The bundled source remains available for native playback. */
				}
			})();
		}
		return () => {
			controller.abort();
			urls.forEach((url) => URL.revokeObjectURL(url));
		};
	});
	function play(id: ClipId, button: HTMLButtonElement) {
		trigger = button;
		button.focus({ preventScroll: true });
		playbackSource = localClips[id] ?? clips[id].src;
		flushSync(() => {
			selected = id;
		});
		dialog?.showModal();
		void player?.play().catch(() => {});
	}
	function onClose() {
		player?.pause();
		selected = undefined;
		trigger?.focus({ preventScroll: true });
	}
</script>

{#if data.listingDetails?.reviewMedia.length}
	<section
		class="border-t-8 border-[var(--seam,#f2f2f2)] px-[0.8rem] pt-[0.9em] pb-[1em]"
		aria-labelledby="digital-video-title"
	>
		<h3 class="mx-0 mt-0 mb-[0.7em] text-[1em] font-semibold" id="digital-video-title">
			{th ? 'วิดีโอสินค้าจำลอง' : 'Simulated product videos'}
		</h3>
		<div class="rail flex gap-[0.5em] overflow-x-auto p-0.5">
			{#each data.listingDetails.reviewMedia as item (item.mediaId)}
				<button
					type="button"
					class="poster relative max-w-48 min-w-32 flex-[0_0_calc((100%-1em)/3)] cursor-pointer overflow-hidden rounded bg-[#16161a] p-0 text-start text-white [border:0] [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)] focus-visible:outline-solid"
					aria-label={th ? clips[item.mediaId].th : clips[item.mediaId].en}
					onclick={(event) => play(item.mediaId, event.currentTarget)}
				>
					<img
						class="block aspect-[4/5] h-auto w-full object-cover object-bottom"
						src={clips[item.mediaId].poster}
						width="160"
						height="208"
						alt=""
						loading="lazy"
					/>
					<span
						class="play absolute top-[42%] left-1/2 grid size-[2.4em] [transform:translate(-50%,-50%)] place-items-center rounded-[50%] bg-[rgb(22_22_26/80%)]"
						aria-hidden="true"
					>
						<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
							<path d="M6 3.5v17l14-8.5z" />
						</svg>
					</span>
					<span
						class="caption absolute inset-x-0 bottom-0 line-clamp-2 bg-[rgb(22_22_26/90%)] px-[0.5em] py-[0.4em] text-[max(0.875rem,var(--action-font-floor,0rem))] leading-[1.4] [line-clamp:2]"
					>
						{clips[item.mediaId].label[data.language]}
					</span>
				</button>
			{/each}
		</div>
	</section>
	<dialog
		class="max-h-[90dvh] w-[min(calc(100%-2rem),40rem)] border border-[#aaa] bg-[var(--paper,white)] p-[0.6em] text-[var(--ink,#16161a)] backdrop:bg-[rgb(0_0_0/55%)]"
		bind:this={dialog}
		aria-label={th ? 'วิดีโอสินค้าจำลอง' : 'Simulated product video'}
		onclose={onClose}
	>
		<button
			type="button"
			class="close ms-auto mb-[0.5em] block min-h-[var(--tap,44px)] cursor-pointer border border-current bg-transparent px-[0.8em] py-[0.4em] text-inherit [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)] focus-visible:outline-solid"
			onclick={() => dialog?.close()}
		>
			{th ? 'ปิดวิดีโอ' : 'Close video'}
		</button>
		{#if selected}
			<video
				class="block max-h-[70dvh] w-full bg-[#16161a]"
				bind:this={player}
				src={playbackSource}
				poster={clips[selected].poster}
				controls
				muted
				playsinline
				aria-label={th ? clips[selected].th : clips[selected].en}
			></video>
		{/if}
	</dialog>
{/if}
