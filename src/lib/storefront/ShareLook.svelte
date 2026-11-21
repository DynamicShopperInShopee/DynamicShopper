<script lang="ts">
	import { tick } from 'svelte';
	import { encodeSharedLook } from './browserState';
	import type { FactLocale } from './verifyFacts';

	let {
		locale,
		storefrontUrl,
		plan,
		presentationFields
	}: {
		locale: FactLocale;
		storefrontUrl: string;
		plan: Record<string, unknown>;
		presentationFields: readonly string[];
	} = $props();

	const copy = {
		en: {
			note: 'This link shares the store layout and preferences.',
			copy: 'Copy link',
			line: 'Share via LINE',
			copied: 'Link copied',
			manual: 'Copy the link from the field below',
			field: 'Store look link',
			unavailable: 'A share link is unavailable'
		},
		th: {
			note: 'ลิงก์นี้แชร์รูปแบบร้านและการตั้งค่าการแสดงผล',
			copy: 'คัดลอกลิงก์',
			line: 'แชร์ผ่าน LINE',
			copied: 'คัดลอกลิงก์แล้ว',
			manual: 'คัดลอกลิงก์จากช่องด้านล่างได้เลย',
			field: 'ลิงก์รูปแบบร้าน',
			unavailable: 'ยังสร้างลิงก์แชร์ไม่ได้'
		}
	};

	const t = $derived(copy[locale]);
	const shareUrl = $derived.by(() => {
		const token = encodeSharedLook(plan, presentationFields);
		if (!token) return;
		try {
			const url = new URL(storefrontUrl);
			if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return;
			url.hash = '';
			url.search = new URLSearchParams({ look: token }).toString();
			return url.href;
		} catch {
			return undefined;
		}
	});
	const lineUrl = $derived(
		shareUrl
			? 'https://social-plugins.line.me/lineit/share?' + new URLSearchParams({ url: shareUrl })
			: undefined
	);

	let result = $state<{ url: string; status: 'copied' | 'manual' }>();
	const status = $derived(result?.url === shareUrl ? result?.status : undefined);
	let manualLink: HTMLInputElement | undefined = $state();
	let copyAttempt = 0;

	async function copyLink(url: string) {
		const attempt = ++copyAttempt;
		let outcome: 'copied' | 'manual' = 'copied';
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			outcome = 'manual';
		}
		if (attempt !== copyAttempt || url !== shareUrl) return;
		result = { url, status: outcome };
		if (outcome === 'manual') {
			await tick();
			manualLink?.focus();
			manualLink?.select();
		}
	}
</script>

<div lang={locale}>
	{#if shareUrl && lineUrl}
		<p>{t.note}</p>
		<div class="actions">
			<button type="button" onclick={() => copyLink(shareUrl)}>{t.copy}</button>
			<a href={lineUrl} target="_blank" rel="noopener noreferrer">{t.line}</a>
		</div>
		<div role="status">{status ? t[status] : ''}</div>
		{#if status === 'manual'}
			<label>
				{t.field}
				<input bind:this={manualLink} value={shareUrl} readonly />
			</label>
		{/if}
	{:else}
		<p>{t.unavailable}</p>
	{/if}
</div>

<style>
	p {
		margin: 0 0 0.5rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	button,
	a,
	input {
		box-sizing: border-box;
		min-height: var(--tap, 44px);
		border: 1px solid var(--seam, currentColor);
		padding: 0.25rem 0.75rem;
		background: var(--paper, #fff);
		color: inherit;
		font: inherit;
	}
	button,
	a {
		display: inline-grid;
		place-items: center;
		cursor: pointer;
	}
	:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	[role='status']:not(:empty) {
		margin-block: 0.5rem;
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
	input {
		width: 100%;
		min-width: 0;
	}
</style>
