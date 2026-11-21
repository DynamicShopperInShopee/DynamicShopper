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

<section
	class="preferences group/preferences grid gap-2 min-[640px]:has-[.chips]:grid-cols-[minmax(0,1fr)_auto]"
	aria-label={t.preferences}
	lang={locale}
>
	{#if chips.length}
		<ul class="actions chips m-0 flex list-none flex-wrap gap-2 p-0">
			{#each chips as chip (chip.id)}
				<li>
					<button
						type="button"
						class="chip min-h-[var(--tap,44px)] max-w-full min-w-0 rounded-[999px] border border-[var(--seam,currentColor)] bg-[var(--surface,#fff)] px-3 py-1 text-start wrap-anywhere text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current enabled:cursor-pointer"
						aria-label={t.remove(chip.label[locale])}
						onclick={() => onRemove(chip.id)}
					>
						{chip.label[locale]}
						<span
							class="remove relative ms-[0.25em] inline-block h-[0.6em] w-[0.6em] text-[var(--muted,#5d5d63)] before:absolute before:inset-[50%_0_auto] before:[transform:rotate(45deg)] before:content-[''] before:[border-top:1px_solid_currentColor] after:absolute after:inset-[50%_0_auto] after:[transform:rotate(-45deg)] after:content-[''] after:[border-top:1px_solid_currentColor]"
							aria-hidden="true"
						></span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
	<div class="actions flex flex-wrap gap-2">
		{#if personas.length}
			<select
				class="min-h-[var(--tap,44px)] max-w-full min-w-0 cursor-pointer border border-[var(--seam,currentColor)] bg-[var(--surface,#fff)] px-3 py-1 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
				aria-label={t.persona}
				onchange={choosePersona}
			>
				<option value="" disabled selected>
					{t.persona}
				</option>
				{#each personas as persona (persona.id)}
					<option value={persona.id}>
						{persona.label[locale]}
					</option>
				{/each}
			</select>
		{/if}
		<button
			class="min-h-[var(--tap,44px)] max-w-full min-w-0 border border-[var(--seam,currentColor)] bg-[var(--surface,#fff)] px-3 py-1 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current enabled:cursor-pointer"
			type="button"
			onclick={onUndo}
			disabled={!canUndo}
		>
			{t.undo}
		</button>
		<button
			class="min-h-[var(--tap,44px)] max-w-full min-w-0 border border-[var(--seam,currentColor)] bg-[var(--surface,#fff)] px-3 py-1 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current enabled:cursor-pointer"
			type="button"
			onclick={onReset}
			disabled={!canReset}
		>
			{t.reset}
		</button>
	</div>
	<div class="min-[640px]:group-has-[.chips]/preferences:col-span-full" role="status">
		{#if changes.length}
			<div class="receipt mt-3 border border-dashed border-[var(--seam,currentColor)] p-3">
				<h2 class="m-0 text-[1em]">
					{t.changes}
				</h2>
				<ul class="mx-0 mt-1 mb-0 ps-[1.5em]">
					{#each changes as change, index (index)}<li>
							{change[locale]}
						</li>{/each}
				</ul>
			</div>
		{/if}
	</div>
</section>
