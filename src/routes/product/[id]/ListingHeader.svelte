<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	let { data, hero }: { data: PageData; hero?: HTMLElement } = $props();
	const th = $derived(data.language === 'th');
	let overHero = $state(true);
	$effect(() => {
		if (!hero) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				overHero = entry.isIntersecting;
			},
			{ rootMargin: '-60px 0px 0px' }
		);
		observer.observe(hero);
		return () => observer.disconnect();
	});
</script>

<header data-over-hero={overHero}>
	<a
		class="back"
		href={resolve('/') + (data.receiptQuery ? '?' + data.receiptQuery : '')}
		aria-label={th ? 'กลับหน้าร้าน' : 'Back to store'}
	>
		<svg
			viewBox="0 0 24 24"
			width="24"
			height="24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			aria-hidden="true"
		>
			<path d="M21 12H4m7-7-7 7 7 7" />
		</svg>
	</a>
	<span class="hero-space" aria-hidden="true"></span>
	<a
		class="header-search"
		href={resolve('/') + (data.receiptQuery ? '?' + data.receiptQuery : '')}
		aria-label={th ? 'ค้นหาสินค้า' : 'Search products'}
	>
		<svg
			viewBox="0 0 20 20"
			width="18"
			height="18"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			aria-hidden="true"
		>
			<circle cx="8" cy="8" r="5" /><path d="m12 12 5 5" />
		</svg>
		<span>{th ? 'ค้นหาสินค้า' : 'Search products'}</span>
	</a>
	<a
		class="language"
		href={resolve(
			`/product/[id]?lang=${th ? 'en' : 'th'}${data.theme === 'standard' ? '' : `&theme=${data.theme}`}${data.receiptQuery ? '&' + data.receiptQuery : ''}`,
			{
				id: data.pathId
			}
		)}
	>
		{th ? 'English' : 'ไทย'}
	</a>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		border-bottom: 1px solid #e9e6dc;
		position: sticky;
		top: 0;
		z-index: 1;
		background: #fff;
		padding: 0.375rem 0.75rem;
	}
	header a {
		min-height: var(--tap, 44px);
		display: flex;
		align-items: center;
		color: inherit;
	}
	.hero-space {
		display: none;
	}
	.back {
		flex: 0 0 var(--tap, 44px);
		justify-content: center;
	}
	.header-search {
		flex: 1;
		min-width: 0;
		gap: 0.5rem;
		padding-inline: 0.65rem;
		background: #f4f4f4;
	}
	@media (max-width: 699px) {
		header {
			height: 60px;
			box-sizing: border-box;
			margin-bottom: -60px;
			border: 0;
			background: transparent;
			padding: 8px;
			gap: 4px;
			pointer-events: none;
		}
		header a {
			box-sizing: border-box;
			min-width: var(--tap, 44px);
			justify-content: center;
			background: #27394e;
			color: white;
			border-radius: 999px;
			text-decoration: none;
			pointer-events: auto;
		}
		header .back {
			margin-inline-end: 0.2rem;
		}
		.hero-space {
			display: block;
			flex: 1;
		}
		header .header-search {
			background: #27394e;
			flex: 0 0 var(--tap, 44px);
			padding: 0;
		}
		.header-search span {
			display: none;
		}
		.language {
			padding-inline: 0.55rem;
			font-size: inherit;
		}
		header[data-over-hero='false'] {
			background: #fff;
			border-bottom: 1px solid #e9e6dc;
		}
		header[data-over-hero='false'] .hero-space {
			display: none;
		}
		header[data-over-hero='false'] a {
			color: #16161a;
			background: #fff;
		}
		header[data-over-hero='false'] .header-search {
			flex: 1 1 auto;
			justify-content: flex-start;
			padding-inline: 0.65rem;
			background: #f4f4f4;
			border-radius: 4px;
		}
		header[data-over-hero='false'] .header-search span {
			display: inline;
		}
	}
</style>
