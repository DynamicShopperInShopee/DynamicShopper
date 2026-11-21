<script lang="ts">
	import type { PageData } from './$types';

	type Row = PageData['specs'][number];

	let {
		src,
		th,
		width,
		depth,
		height,
		technical
	}: {
		src: string;
		th: boolean;
		width?: Row;
		depth?: Row;
		height?: Row;
		technical: readonly (Row | undefined)[];
	} = $props();
</script>

{#snippet measurement(row: Row | undefined, edge: 'width' | 'depth' | 'height')}
	{#if row}
		<div class="measurement {edge}">
			<dt class="sr-only">{row.label}</dt>
			<dd {...row.attributes}>{row.text}</dd>
		</div>
	{/if}
{/snippet}

<section id="digital-dimensions" aria-labelledby="digital-dimensions-title">
	<figure>
		<figcaption id="digital-dimensions-title">{th ? 'ขนาดเครื่อง' : 'Dimensions'}</figcaption>
		<div class="diagram">
			<img
				{src}
				alt={th ? 'หม้อหุงข้าวพร้อมเส้นบอกขนาด' : 'Rice cooker with dimension lines'}
				width="840"
				height="840"
				loading="lazy"
			/>
			<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
				<path d="M22 14v59m-0.9-59h1.8m-1.8 59h1.8M26 75l41 3m-41-4v2m41 1v2m0-1 17-8m0-1v2" />
			</svg>
			<dl>
				{@render measurement(height, 'height')}
				{@render measurement(width, 'width')}
				{@render measurement(depth, 'depth')}
			</dl>
		</div>
	</figure>
	<dl class="technical">
		{#each technical as row, index (row?.attributes['data-fact'] ?? index)}
			{#if row}
				<div>
					<dt>{row.label}</dt>
					<dd
						class:figure={Number.isFinite(Number(row.attributes['data-raw'])) ||
							row.attributes['data-fact'] === 'detail.voltage' ||
							row.attributes['data-fact'] === 'detail.model'}
						{...row.attributes}
					>
						{row.text}
					</dd>
				</div>
			{/if}
		{/each}
	</dl>
</section>

<style>
	section {
		scroll-margin-top: 5rem;
	}
	figure,
	dl,
	dd {
		margin: 0;
	}
	figcaption {
		padding: 1.2em 0.4em 0;
		font-size: 1.45em;
		font-weight: 600;
		text-align: center;
	}
	.diagram {
		position: relative;
		aspect-ratio: 1.08;
	}
	img,
	svg,
	.measurement {
		position: absolute;
	}
	img {
		inset-block-start: 0;
		inset-inline-start: 12%;
		width: 84%;
		height: auto;
	}
	svg {
		inset: 0;
		width: 100%;
		height: 108%;
		stroke: currentColor;
		stroke-width: 0.35;
	}
	.measurement {
		line-height: 1.3;
		text-align: center;
		text-wrap: balance;
	}
	.measurement dd,
	.figure {
		font-family: var(--product-figure-font);
	}
	.height {
		inset-inline-start: 0;
		inset-block-start: 47%;
		inline-size: 21%;
		transform: translateY(-50%);
	}
	.width {
		inset-inline-start: 27%;
		inset-block-start: 87%;
		inline-size: 39%;
	}
	.depth {
		inset-inline-start: 68%;
		inset-block-start: 85.5%;
		inline-size: 30%;
	}
	.technical {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1px;
		margin: 0.2em 4% 1em;
		background: var(--detail-seam);
		text-align: center;
	}
	.technical div {
		padding: 0.38em 0.25em;
		background: var(--detail-panel);
		line-height: 1.3;
		overflow-wrap: anywhere;
	}
	.technical dt {
		color: var(--detail-muted);
	}
	.technical dd {
		font-weight: 600;
	}
</style>
