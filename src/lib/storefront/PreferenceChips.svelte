<script lang="ts">
	import type { Locale } from '../catalog';
	import type { ShopperPlan } from '../personalization/plan';
	import { derivePreferenceChips } from './preferences';

	let {
		plan,
		locale,
		onRemove
	}: {
		plan: ShopperPlan;
		locale: Locale;
		onRemove: (patch: Partial<ShopperPlan>, field: keyof ShopperPlan, resetField: boolean) => void;
	} = $props();

	const chips = $derived(derivePreferenceChips(plan, locale));
</script>

{#if chips.length}
	<ul lang={locale} aria-label={locale === 'th' ? 'การตั้งค่าร้าน' : 'Store preferences'}>
		{#each chips as { id, label, patch, field, resetField } (id)}
			<li>
				<button
					type="button"
					aria-label={locale === 'th' ? `นำ ${label} ออก` : `Remove ${label}`}
					onclick={() => onRemove(patch, field, resetField)}
				>
					<span class="label">{label}</span>
					<span class="remove" aria-hidden="true"></span>
				</button>
			</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		max-inline-size: 100%;
	}

	button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.625rem;
		max-inline-size: 100%;
		min-inline-size: var(--tap, 44px);
		min-block-size: var(--tap, 44px);
		padding: 0.375rem 0.875rem;
		border: 1px solid var(--muted, #5d5d63);
		border-radius: 999px;
		background: var(--surface, white);
		color: var(--ink, #16161a);
		font: inherit;
		text-align: start;
		cursor: pointer;
	}

	button:hover {
		background: var(--tile, #e9e6dc);
	}

	button:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: 2px;
	}

	.label {
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}

	.remove {
		position: relative;
		flex: 0 0 0.75em;
		block-size: 0.75em;
	}

	.remove::before,
	.remove::after {
		position: absolute;
		inset: 50% 0 auto;
		block-size: 1px;
		background: currentColor;
		content: '';
		transform: rotate(45deg);
	}

	.remove::after {
		transform: rotate(-45deg);
	}
</style>
