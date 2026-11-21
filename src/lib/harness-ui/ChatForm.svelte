<script lang="ts">
	import type { Locale } from '../catalog';

	let {
		locale,
		onSend,
		pending = false
	}: { locale: Locale; onSend: (message: string) => void; pending?: boolean } = $props();
	let draft = $state('');
	let input: HTMLInputElement;
	const th = $derived(locale === 'th');
	const suggestions = {
		en: ['Shopping for my mom', 'Compare rice cookers', 'Find the best deal'],
		th: ['ซื้อให้แม่', 'เปรียบเทียบหม้อหุงข้าว', 'หาราคาดีที่สุด']
	};

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const message = draft.trim();
		if (!message) return;
		onSend(message);
		draft = '';
		input.focus();
	}
</script>

<form
	class="flex flex-wrap items-end gap-[0.55rem]"
	aria-label={th ? 'ถามหน้าร้าน' : 'Ask the store'}
	onsubmit={submit}
>
	<label class="grid min-w-0 flex-[1_1_10rem] gap-[0.2rem] font-semibold">
		<span>{th ? 'ถามหน้าร้าน' : 'Ask the store'}</span>
		<input
			class="min-h-[var(--tap,44px)] w-full min-w-0 rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-3 font-normal caret-[var(--accent)]"
			type="text"
			bind:this={input}
			bind:value={draft}
			maxlength="500"
		/>
	</label>
	<button
		class="send min-h-[var(--tap,44px)] cursor-pointer rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-3 font-semibold text-[var(--on-accent,white)] hover:border-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
		type="submit"
		disabled={pending || !draft.trim()}
	>
		{th ? 'ส่ง' : 'Send'}
	</button>
</form>
<div
	class="suggestions mt-[0.55rem] flex flex-wrap gap-[0.4rem]"
	aria-label={th ? 'คำแนะนำ' : 'Suggestions'}
>
	{#each suggestions[locale] as suggestion (suggestion)}
		<button
			class="min-h-[var(--tap,44px)] cursor-pointer rounded-[999px] border border-[var(--seam)] bg-[var(--surface)] px-3 text-[var(--ink)] hover:border-[var(--ink)]"
			type="button"
			disabled={pending}
			onclick={() => onSend(suggestion)}
		>
			{suggestion}
		</button>
	{/each}
</div>
