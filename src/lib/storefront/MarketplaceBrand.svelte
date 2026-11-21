<script lang="ts">
	import type { Locale } from '../catalog';
	let {
		locale,
		showControls,
		allowTheme = true,
		enabled,
		theme,
		themes,
		ontheme,
		onlocale
	}: {
		locale: Locale;
		showControls: boolean;
		allowTheme?: boolean;
		enabled: boolean;
		theme: string;
		themes: { value: string; label: string }[];
		ontheme: (value: string) => void;
		onlocale: () => void;
	} = $props();
</script>

<header class="marketplace-brand" aria-label="DynamicShopper">
	<div class="brand-inner">
		<div class="wordmark">
			<svg
				viewBox="0 0 24 24"
				width="32"
				height="36"
				fill="none"
				stroke="currentColor"
				stroke-width="1.7"
				aria-hidden="true"
			>
				<path d="M5 3h14v18l-3.5-2-3.5 2-3.5-2L5 21zM8 8h8m-8 4h8m-8 4h4" />
			</svg><span>DynamicShopper</span>
		</div>
		<p>{locale === 'th' ? 'เลือกซื้อในแบบของคุณ' : 'Shop your way'}</p>
		{#if showControls}
			<div class="brand-controls">
				{#if allowTheme}<select
						aria-label={locale === 'th' ? 'ธีม' : 'Theme'}
						value={theme}
						onchange={(event) => ontheme(event.currentTarget.value)}
					>
						{#each themes as option (option.value)}<option value={option.value}>
								{option.label}
							</option>{/each}
					</select>{/if}<button disabled={!enabled} onclick={onlocale}>
					{locale === 'th' ? 'English' : 'ไทย'}
				</button>
			</div>
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
