<script lang="ts">
	import type { FactLocale, LocalizedText } from './verifyFacts';

	let {
		terms,
		locale,
		productCount,
		simplified = false,
		comparePane = false
	}: {
		terms: readonly { label: LocalizedText; contribution: number }[];
		locale: FactLocale;
		productCount: number;
		simplified?: boolean;
		comparePane?: boolean;
	} = $props();

	const copy = {
		en: { title: 'Why this order?', lead: 'Biggest reasons first' },
		th: { title: 'ทำไมถึงเรียงแบบนี้?', lead: 'เหตุผลที่มีผลมากที่สุดก่อน' }
	};
	const widths = ['short', 'medium', 'wide', 'full'] as const;
	const t = $derived(copy[locale]);

	const reasons = $derived(
		terms
			.filter(
				({ label, contribution }) =>
					Number.isFinite(contribution) &&
					contribution > 0 &&
					Boolean(label[locale].trim()) &&
					!/\p{N}|\p{Sc}/u.test(label[locale])
			)
			.slice(0, 3)
	);
	const largest = $derived(Math.max(...reasons.map(({ contribution }) => contribution)));

	function width(contribution: number) {
		const step = Math.max(0, Math.ceil((contribution / largest) * widths.length) - 1);
		return widths[step];
	}
</script>

{#if productCount > 1 && !simplified && !comparePane && reasons.length}
	<details lang={locale}>
		<summary>{t.title}</summary>
		<p>{t.lead}</p>
		<ul>
			{#each reasons as reason}
				<li>
					<span>{reason.label[locale]}</span>
					<span class="track" aria-hidden="true">
						<span class="bar" data-width={width(reason.contribution)}></span>
					</span>
				</li>
			{/each}
		</ul>
	</details>
{/if}

<style>
	details {
		padding-inline: 0.75rem;
		border: 1px dashed var(--ink, #16161a);
	}
	summary {
		min-height: var(--tap, 44px);
		align-content: center;
		cursor: pointer;
	}
	summary:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	p {
		margin: 0.25rem 0 0.5rem;
	}
	ul {
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(2rem, 35%);
		align-items: center;
		gap: 0.5rem;
	}
	.track {
		display: block;
	}
	.bar {
		display: block;
		height: 0.375rem;
		background: currentColor;
	}
	[data-width='short'] {
		width: 25%;
	}
	[data-width='medium'] {
		width: 50%;
	}
	[data-width='wide'] {
		width: 75%;
	}
	[data-width='full'] {
		width: 100%;
	}
</style>
