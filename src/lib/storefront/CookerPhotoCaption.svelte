<script lang="ts">
	import FactValue from './FactValue.svelte';
	import type { Locale } from '../catalog';

	let { locale, compact = false }: { locale: Locale; compact?: boolean } = $props();
</script>

<div class="caption" class:compact>
	<div class="merchant"><FactValue productId="cooker-one-button" field="shop" {locale} /></div>
	<div class="capacity">
		<strong><FactValue productId="cooker-one-button" field="spec.capacity" {locale} /></strong>
		<span>{locale === 'th' ? 'ความจุ' : 'Capacity'}</span>
	</div>
</div>

<style>
	.caption {
		position: absolute;
		inset: 0;
		container-type: inline-size;
		pointer-events: none;
		color: #fff;
		text-align: start;
	}
	.merchant {
		position: absolute;
		inset-inline-start: 16%;
		top: var(--gallery-caption-top, 4.5%);
		max-width: 51%;
		background: var(--gallery-caption-surface, transparent);
		color: var(--gallery-caption-ink, inherit);
		padding: var(--gallery-caption-padding, 0);
		font-size: max(var(--action-font-floor, 12px), clamp(14px, 4cqi, 24px));
		font-weight: 600;
	}
	.capacity {
		position: absolute;
		top: 36%;
		inset-inline-start: 4%;
		display: grid;
		line-height: 1.25;
		font-size: max(var(--action-font-floor, 12px), clamp(12px, 3.7cqi, 20px));
	}
	.capacity strong {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace;
		font-size: 1.35em;
	}
	.compact .merchant {
		inset-inline-start: 4%;
		max-width: 92%;
		font-size: max(var(--small, 12px), 12px);
	}
</style>
