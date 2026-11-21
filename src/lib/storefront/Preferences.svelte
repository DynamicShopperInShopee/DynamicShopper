<script lang="ts">
	import type { FactLocale, LocalizedText } from './verifyFacts';

	type Choice = { id: string; label: LocalizedText };

	let {
		locale,
		chips,
		personas,
		changes = [],
		canUndo,
		canReset,
		onRemove,
		onPersona,
		onUndo,
		onReset
	}: {
		locale: FactLocale;
		chips: readonly Choice[];
		personas: readonly Choice[];
		changes?: readonly LocalizedText[];
		canUndo: boolean;
		canReset: boolean;
		onRemove: (id: string) => void;
		onPersona: (id: string) => void;
		onUndo: () => void;
		onReset: () => void;
	} = $props();

	const copy = {
		en: {
			changes: 'What changed',
			preferences: 'Store preferences',
			persona: 'Persona',
			remove: (name: string) => `Remove ${name}`,
			undo: 'Undo',
			reset: 'Reset'
		},
		th: {
			changes: 'สิ่งที่เปลี่ยน',
			preferences: 'การตั้งค่าร้าน',
			persona: 'รูปแบบร้าน',
			remove: (name: string) => `นำ ${name} ออก`,
			undo: 'ย้อนกลับ',
			reset: 'คืนค่าเริ่มต้น'
		}
	};
	const t = $derived(copy[locale]);

	function choosePersona(event: Event & { currentTarget: HTMLSelectElement }) {
		const select = event.currentTarget;
		if (!select.value) return;
		onPersona(select.value);
		select.value = '';
	}
</script>

<section class="preferences" aria-label={t.preferences} lang={locale}>
	{#if chips.length}
		<ul class="actions chips">
			{#each chips as chip (chip.id)}
				<li>
					<button
						type="button"
						class="chip"
						aria-label={t.remove(chip.label[locale])}
						onclick={() => onRemove(chip.id)}
					>
						{chip.label[locale]} <span class="remove" aria-hidden="true"></span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
	<div class="actions">
		{#if personas.length}
			<select aria-label={t.persona} onchange={choosePersona}>
				<option value="" disabled selected>{t.persona}</option>
				{#each personas as persona (persona.id)}
					<option value={persona.id}>{persona.label[locale]}</option>
				{/each}
			</select>
		{/if}
		<button type="button" onclick={onUndo} disabled={!canUndo}>{t.undo}</button>
		<button type="button" onclick={onReset} disabled={!canReset}>{t.reset}</button>
	</div>
	<div role="status">
		{#if changes.length}
			<div class="receipt">
				<h2>{t.changes}</h2>
				<ul>
					{#each changes as change, index (index)}<li>{change[locale]}</li>{/each}
				</ul>
			</div>
		{/if}
	</div>
</section>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.preferences {
		display: grid;
		gap: 0.5rem;
	}
	.chips {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	button,
	select {
		min-width: 0;
		min-height: var(--tap, 44px);
		max-width: 100%;
		border: 1px solid var(--seam, currentColor);
		padding: 0.25rem 0.75rem;
		background: var(--surface, #fff);
		color: inherit;
		font: inherit;
	}
	button:enabled,
	select {
		cursor: pointer;
	}
	:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	.chip {
		border-radius: 999px;
		overflow-wrap: anywhere;
		text-align: start;
	}
	.remove {
		display: inline-block;
		position: relative;
		width: 0.6em;
		height: 0.6em;
		margin-inline-start: 0.25em;
		color: var(--muted, #5d5d63);
	}
	.remove::before,
	.remove::after {
		position: absolute;
		inset: 50% 0 auto;
		border-top: 1px solid currentColor;
		content: '';
	}
	.remove::before {
		transform: rotate(45deg);
	}
	.remove::after {
		transform: rotate(-45deg);
	}
	.receipt {
		margin-block-start: 0.75rem;
		border: 1px dashed var(--seam, currentColor);
		padding: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1em;
	}
	.receipt ul {
		margin: 0.25rem 0 0;
		padding-inline-start: 1.5em;
	}
	@media (min-width: 640px) {
		.preferences:has(.chips) {
			grid-template-columns: minmax(0, 1fr) auto;
		}
		.preferences:has(.chips) [role='status'] {
			grid-column: 1 / -1;
		}
	}
</style>
