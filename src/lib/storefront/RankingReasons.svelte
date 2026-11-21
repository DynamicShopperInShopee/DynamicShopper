<script lang="ts">
	import type { FactLocale, LocalizedText } from './verifyFacts';

	const priorities = {
		price: { en: 'Lower price', th: 'ราคาต่ำลง' },
		performance: { en: 'Better performance', th: 'ประสิทธิภาพดีขึ้น' },
		durability: { en: 'Better durability', th: 'ทนทานขึ้น' },
		design: { en: 'Better design', th: 'ดีไซน์ดีขึ้น' },
		rating: { en: 'Higher rating', th: 'คะแนนสูงขึ้น' },
		value: { en: 'Better value', th: 'คุ้มค่าขึ้น' }
	} satisfies Record<string, LocalizedText>;
	const numericSpecs = {
		dpi: { en: 'pointer sensitivity', th: 'ความไวเมาส์' },
		weight: { en: 'weight', th: 'น้ำหนัก' },
		battery: { en: 'battery life', th: 'อายุแบตเตอรี่' },
		pollingRate: { en: 'polling rate', th: 'อัตราส่งสัญญาณ' },
		latency: { en: 'latency', th: 'ความหน่วง' },
		capacity: { en: 'capacity', th: 'ความจุ' },
		output: { en: 'power output', th: 'กำลังจ่ายไฟ' },
		power: { en: 'power', th: 'กำลังไฟ' },
		programs: { en: 'program count', th: 'จำนวนโปรแกรม' },
		warranty: { en: 'warranty length', th: 'ระยะประกัน' },
		volume: { en: 'volume', th: 'ปริมาตร' },
		spf: { en: 'sun protection factor', th: 'ค่าป้องกันแสงแดด' }
	} satisfies Record<string, LocalizedText>;
	const strengths = ['full', 'high', 'medium', 'low'] as const;

	type RankTerm = Readonly<
		(
			| { kind: 'priority'; key: string }
			| { kind: 'spec'; key: string; direction: 'higher' | 'lower' }
		) & {
			strength: (typeof strengths)[number];
		}
	>;

	let {
		terms,
		locale,
		productCount,
		simplified = false,
		comparePane = false
	}: {
		terms: readonly RankTerm[];
		locale: FactLocale;
		productCount: number;
		simplified?: boolean;
		comparePane?: boolean;
	} = $props();

	const copy = {
		en: { title: 'Why this order?', lead: 'Biggest reasons first' },
		th: { title: 'ทำไมถึงเรียงแบบนี้?', lead: 'เหตุผลที่มีผลมากที่สุดก่อน' }
	};
	const t = $derived(copy[locale]);

	function labelFor(term: RankTerm, language: FactLocale): string | undefined {
		if (term.kind === 'priority') {
			if (!Object.hasOwn(priorities, term.key)) return;
			return priorities[term.key as keyof typeof priorities][language];
		}
		if (!Object.hasOwn(numericSpecs, term.key)) return;
		if (term.key === 'battery' && term.direction === 'higher') {
			return language === 'en' ? 'Longer battery life' : 'แบตเตอรี่อึดขึ้น';
		}
		if (term.key === 'weight' && term.direction === 'lower' && language === 'th') {
			return 'น้ำหนักเบาลง';
		}
		const spec = numericSpecs[term.key as keyof typeof numericSpecs][language];
		return language === 'en'
			? `${term.direction === 'higher' ? 'Higher' : 'Lower'} ${spec}`
			: `${spec}${term.direction === 'higher' ? 'สูงขึ้น' : 'ลดลง'}`;
	}

	const reasons = $derived(
		terms
			.flatMap((term) => {
				const label = labelFor(term, locale);
				return label && strengths.includes(term.strength)
					? [{ label, strength: term.strength }]
					: [];
			})
			.slice(0, 3)
	);
</script>

{#if productCount > 1 && !simplified && !comparePane && reasons.length}
	<details class="border border-dashed border-[var(--ink,#16161a)] px-3" lang={locale}>
		<summary
			class="min-h-[var(--tap,44px)] cursor-pointer content-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
		>
			{t.title}
		</summary>
		<p class="mt-1 mb-2">{t.lead}</p>
		<ul class="list-none p-0">
			{#each reasons as reason, index (index)}
				<li class="grid grid-cols-[minmax(0,1fr)_minmax(2rem,35%)] items-center gap-2">
					<span>{reason.label}</span>
					<span class="track block" aria-hidden="true">
						<span
							class="bar block h-1.5 bg-current data-[width=full]:w-full data-[width=high]:w-3/4 data-[width=low]:w-1/4 data-[width=medium]:w-1/2"
							data-width={reason.strength}
						></span>
					</span>
				</li>
			{/each}
		</ul>
	</details>
{/if}
