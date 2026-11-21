<script lang="ts">
	import type { Locale } from '../catalog';

	let { locale, onSend }: { locale: Locale; onSend: (message: string) => void } = $props();
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

<form aria-label={th ? 'ถามหน้าร้าน' : 'Ask the store'} onsubmit={submit}>
	<label>
		<span>{th ? 'ถามหน้าร้าน' : 'Ask the store'}</span>
		<input type="text" bind:this={input} bind:value={draft} maxlength="1000" />
	</label>
	<button class="send" type="submit" disabled={!draft.trim()}>{th ? 'ส่ง' : 'Send'}</button>
</form>
<div class="suggestions" aria-label={th ? 'คำแนะนำ' : 'Suggestions'}>
	{#each suggestions[locale] as suggestion (suggestion)}
		<button type="button" onclick={() => onSend(suggestion)}>{suggestion}</button>
	{/each}
</div>

<style>
	form {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.55rem;
	}
	label {
		display: grid;
		flex: 1 1 10rem;
		min-inline-size: 0;
		gap: 0.2rem;
		font-weight: 600;
	}
	input,
	button {
		min-block-size: var(--tap, 44px);
		padding-inline: 0.75rem;
	}
	input {
		width: 100%;
		min-inline-size: 0;
		border: 1px solid var(--ink);
		border-radius: var(--radius);
		background: var(--surface);
		caret-color: var(--accent);
		font-weight: 400;
	}
	button {
		border: 1px solid var(--seam);
		color: var(--ink);
		background: var(--surface);
		cursor: pointer;
	}
	button:hover {
		border-color: var(--ink);
	}
	.send {
		border-color: var(--accent);
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent, white);
		font-weight: 600;
	}
	.send:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-block-start: 0.55rem;
	}
	.suggestions button {
		border-radius: 999px;
	}
</style>
