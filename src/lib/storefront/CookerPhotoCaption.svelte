<script lang="ts">
	import FactValue from './FactValue.svelte';
	import type { Locale } from '../catalog';

	let {
		locale,
		compact = false,
		productId = 'cooker-one-button'
	}: {
		locale: Locale;
		compact?: boolean;
		productId?: 'cooker-one-button' | 'cooker-digital';
	} = $props();
</script>

<div
	class="caption group/caption @container pointer-events-none absolute inset-0 text-start text-white"
	class:compact
>
	<div
		class="merchant absolute start-[16%] top-[var(--gallery-caption-top,4.5%)] max-w-[51%] bg-[var(--gallery-caption-surface,transparent)] p-[var(--gallery-caption-padding,0)] text-[length:max(var(--action-font-floor,12px),clamp(14px,4cqi,24px))] font-semibold text-[var(--gallery-caption-ink,inherit)] group-[.compact]/caption:start-[4%] group-[.compact]/caption:max-w-[92%] group-[.compact]/caption:text-[length:max(var(--small,12px),12px)]"
	>
		<FactValue {productId} field="shop" {locale} />
	</div>
	<div
		class="capacity absolute start-[4%] top-[36%] grid text-[length:max(var(--action-font-floor,12px),clamp(12px,3.7cqi,20px))] leading-[1.25]"
	>
		<strong class="font-[family-name:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace] text-[1.35em]">
			<FactValue
				{productId}
				field={productId === 'cooker-digital' ? 'spec.programs' : 'spec.capacity'}
				{locale}
			/>
		</strong>
		<span>
			{productId === 'cooker-digital'
				? locale === 'th'
					? 'โหมดการปรุง'
					: 'Cooking modes'
				: locale === 'th'
					? 'ความจุ'
					: 'Capacity'}
		</span>
	</div>
</div>
