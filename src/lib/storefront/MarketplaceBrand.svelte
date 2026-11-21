<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Locale } from '../catalog';
	let {
		locale,
		showControls,
		enabled,
		theme,
		themes,
		ontheme,
		onlocale,
		children
	}: {
		locale: Locale;
		showControls: boolean;
		enabled: boolean;
		theme: string;
		themes: { value: string; label: string }[];
		ontheme: (value: string) => void;
		onlocale: () => void;
		children?: Snippet;
	} = $props();
</script>

<header class="marketplace-brand" aria-label="Shopee">
	<div class="brand-inner">
		<div class="wordmark">
			<svg
				viewBox="0 0 32 36"
				width="32"
				height="36"
				fill="none"
				stroke="currentColor"
				stroke-width="1.7"
				aria-hidden="true"
			>
				<path d="M5 10h22l-1.5 23h-19L5 10ZM11 12V7a5 5 0 0 1 10 0v5" /><path
					d="M21 17c-5-4-12 2-5 5s4 8-3 4"
				/>
			</svg><span>Shopee</span>
		</div>
		<p>DynamicShopper · {locale === 'th' ? 'เลือกซื้อในแบบของคุณ' : 'Shop your way'}</p>
		{#if showControls}
			<div class="brand-controls">
				<select
					aria-label={locale === 'th' ? 'ธีม' : 'Theme'}
					value={theme}
					onchange={(event) => ontheme(event.currentTarget.value)}
				>
					{#each themes as option (option.value)}<option value={option.value}>
							{option.label}
						</option>{/each}
				</select><button disabled={!enabled} onclick={onlocale}>
					{locale === 'th' ? 'English' : 'ไทย'}
				</button>
			</div>
			{@render children?.()}
		{/if}
	</div>
</header>

<style>
	.marketplace-brand {
		background: #ee4d2d;
		color: white;
	}
	.brand-inner {
		width: min(1200px, calc(100% - 24px));
		margin-inline: auto;
		display: flex;
		align-items: center;
		gap: 24px;
		padding: 20px 0;
		flex-wrap: wrap;
	}
	.wordmark {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 32px;
		line-height: 1;
		letter-spacing: -1px;
		font-weight: 600;
	}
	p {
		font-size: max(14px, var(--small));
		color: #482016;
		margin: 0;
		flex: 1;
	}
	.brand-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	select,
	button {
		font: inherit;
		color: #262626;
		background: white;
		border: 1px solid #8c2914;
		border-radius: 2px;
		min-height: var(--tap);
		padding: 8px 12px;
		cursor: pointer;
	}
	:focus-visible {
		outline: 2px solid white;
		outline-offset: 3px;
	}
	@media (max-width: 700px) {
		.brand-inner {
			gap: 12px;
			padding: 14px 0;
		}
		.wordmark {
			font-size: 26px;
		}
		p {
			flex-basis: 140px;
			font-size: max(12px, var(--small));
		}
		.brand-controls {
			width: 100%;
		}
	}
</style>
