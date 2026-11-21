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
	<section aria-labelledby="digital-video-title">
		<h3 id="digital-video-title">{th ? 'วิดีโอสินค้าจำลอง' : 'Simulated product videos'}</h3>
		<div class="rail">
			{#each data.listingDetails.reviewMedia as item (item.mediaId)}
				<button
					type="button"
					class="poster"
					aria-label={th ? clips[item.mediaId].th : clips[item.mediaId].en}
					onclick={(event) => play(item.mediaId, event.currentTarget)}
				>
					<img src={clips[item.mediaId].poster} width="160" height="208" alt="" loading="lazy" />
					<span class="play" aria-hidden="true">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
							<path d="M6 3.5v17l14-8.5z" />
						</svg>
					</span>
					<span class="caption">{clips[item.mediaId].label[data.language]}</span>
				</button>
			{/each}
		</div>
	</section>
	<dialog
		bind:this={dialog}
		aria-label={th ? 'วิดีโอสินค้าจำลอง' : 'Simulated product video'}
		onclose={onClose}
	>
		<button type="button" class="close" onclick={() => dialog?.close()}>
			{th ? 'ปิดวิดีโอ' : 'Close video'}
		</button>
		{#if selected}
			<video
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

<style>
	section {
		border-top: 8px solid var(--seam, #f2f2f2);
		padding: 0.9em 0.8rem 1em;
	}
	h3 {
		font-size: 1em;
		font-weight: 600;
		margin: 0 0 0.7em;
	}
	.rail {
		display: flex;
		gap: 0.5em;
		overflow-x: auto;
		padding: 2px;
	}
	.poster {
		position: relative;
		flex: 0 0 calc((100% - 1em) / 3);
		min-width: 8rem;
		max-width: 12rem;
		border: 0;
		padding: 0;
		border-radius: 4px;
		overflow: hidden;
		cursor: pointer;
		color: white;
		background: #16161a;
		text-align: start;
		font: inherit;
	}
	.poster img {
		width: 100%;
		height: auto;
		aspect-ratio: 4/5;
		display: block;
		object-fit: cover;
		object-position: center bottom;
	}
	.play {
		display: grid;
		place-items: center;
		position: absolute;
		left: 50%;
		top: 42%;
		transform: translate(-50%, -50%);
		width: 2.4em;
		height: 2.4em;
		border-radius: 50%;
		background: rgb(22 22 26 / 80%);
	}
	.caption {
		position: absolute;
		inset: auto 0 0;
		padding: 0.4em 0.5em;
		background: rgb(22 22 26 / 90%);
		font-size: max(0.875rem, var(--action-font-floor, 0rem));
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	button:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: 2px;
	}
	dialog {
		width: min(calc(100% - 2rem), 40rem);
		max-height: 90dvh;
		padding: 0.6em;
		border: 1px solid #aaa;
		color: var(--ink, #16161a);
		background: var(--paper, white);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 55%);
	}
	.close {
		display: block;
		margin-inline-start: auto;
		padding: 0.4em 0.8em;
		min-height: var(--tap, 44px);
		color: inherit;
		font: inherit;
		background: transparent;
		border: 1px solid currentColor;
		margin-bottom: 0.5em;
		cursor: pointer;
	}
	video {
		display: block;
		width: 100%;
		max-height: 70dvh;
		background: #16161a;
	}
</style>
