<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteURL } from 'svelte/reactivity';
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
			const url = new SvelteURL(storefrontUrl);
			if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return;
			const query = new URLSearchParams({ look: token }).toString();
			return `${url.origin}${url.pathname}?${query}`;
		} catch {
			return undefined;
		}
	});
	const lineUrl = $derived(
		shareUrl
			? 'https://social-plugins.line.me/lineit/share?' +
					new URLSearchParams({ url: shareUrl }).toString()
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
		<p class="mx-0 mt-0 mb-2">
			{t.note}
		</p>
		<div class="actions flex flex-wrap gap-2">
			<button
				class="box-border inline-grid min-h-[var(--tap,44px)] cursor-pointer place-items-center border border-[var(--seam,currentColor)] bg-[var(--paper,#fff)] px-3 py-1 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
				type="button"
				onclick={() => copyLink(shareUrl)}
			>
				{t.copy}
			</button>
			<!-- eslint-disable svelte/no-navigation-without-resolve -- The destination is LINE's external share service. -->
			<a
				class="box-border inline-grid min-h-[var(--tap,44px)] cursor-pointer place-items-center border border-[var(--seam,currentColor)] bg-[var(--paper,#fff)] px-3 py-1 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
				href={lineUrl}
				target="_blank"
				rel="noopener noreferrer"
			>
				{t.line}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
		<div class={['[&:not(:empty)]:my-2']} role="status">
			{status ? t[status] : ''}
		</div>
		{#if status === 'manual'}
			<label class="grid gap-1">
				{t.field}
				<input
					class="box-border min-h-[var(--tap,44px)] w-full min-w-0 border border-[var(--seam,currentColor)] bg-[var(--paper,#fff)] px-3 py-1 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
					bind:this={manualLink}
					value={shareUrl}
					readonly
				/>
			</label>
		{/if}
	{:else}
		<p class="mx-0 mt-0 mb-2">
			{t.unavailable}
		</p>
	{/if}
</div>
