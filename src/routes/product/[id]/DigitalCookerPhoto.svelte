<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		src,
		alt,
		layout,
		caption,
		footer
	}: {
		id: string;
		src: string;
		alt: string;
		layout: 'intro' | 'serving' | 'pot' | 'cutaway' | 'inset';
		caption: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<figure {id} class={layout}>
	<figcaption>{@render caption()}</figcaption>
	<img {src} {alt} width="700" height="1050" loading="lazy" />
	{@render footer?.()}
</figure>

<style>
	figure {
		margin: 0;
		scroll-margin-top: 5rem;
	}
	figcaption {
		text-align: center;
	}
	img {
		display: block;
		width: 100%;
		height: auto;
		background: var(--detail-panel);
	}
	:is(.intro, .serving, .pot) {
		display: grid;
	}
	:is(.intro, .serving, .pot) > :is(figcaption, img) {
		grid-area: 1 / 1;
	}
	:is(.intro, .serving, .pot) figcaption {
		z-index: 1;
		align-self: start;
		padding: 7% 6% 0;
	}
	.intro figcaption {
		padding: 16% 7% 0;
		text-align: start;
	}
	.serving figcaption {
		padding-inline-start: 29%;
	}
	.cutaway {
		background: #f6f6f6;
	}
	.cutaway figcaption,
	.inset figcaption {
		padding: 1.3em 0.35em 0.65em;
	}
	.cutaway img,
	.inset img {
		aspect-ratio: 1;
		object-fit: cover;
		object-position: center 79%;
	}
	.inset {
		padding: 0 4% 4%;
		background: var(--detail-panel);
	}
	.inset img {
		aspect-ratio: 1.1;
	}
	:global([data-theme='large']) :is(.intro, .serving, .pot) {
		display: block;
		background: var(--detail-panel);
	}
	:global([data-theme='large']) :is(.intro, .serving, .pot) figcaption {
		padding: 0.9em 0.65em;
	}
</style>
