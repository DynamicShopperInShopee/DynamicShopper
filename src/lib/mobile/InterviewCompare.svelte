<script lang="ts">
	import { catalogNameAttributes } from './name-attributes';
	/* eslint-disable svelte/no-navigation-without-resolve -- The product link points to an absolute external source URL. */
	import './shop-theme.css';
	import ShopShelf from './ShopShelf.svelte';
	import Sheet from './Sheet.svelte';
	import { examples, previewInterview } from './interview-examples';
	import {
		interview,
		describePatch,
		preferenceName,
		type Question
	} from '../personalization/interview';
	import type { ShopListing, CatalogCategory } from '../catalog-api/types';
	import { formatBaht } from '../catalog';
	let {
		lang,
		rows,
		categories,
		onclose
	}: {
		lang: 'en' | 'th';
		rows: readonly ShopListing[];
		categories: readonly CatalogCategory[];
		onclose: () => void;
	} = $props();
	let locale = $derived(lang);
	// The comparison language starts with the shop and can be changed without changing it.
	let drafts = $state(examples.map((example) => ({ ...example, answers: { ...example.answers } })));
	let parts = $state(false);
	let selected = $state<ShopListing | null>(null);
	const previews = $derived(
		drafts.map((draft) => ({
			...draft,
			result: previewInterview(draft.answers, locale)
		}))
	);
	const t = (en: string, th: string) => (locale === 'th' ? th : en);
	function change(id: string, key: Question, value: string) {
		drafts = drafts.map((draft) =>
			draft.id === id ? { ...draft, answers: { ...draft.answers, [key]: value } } : draft
		);
	}
</script>

<main class="interview-comparison shop-theme" lang={locale}>
	<header class="comparison-header">
		<div>
			<span class="eyebrow">
				DYNAMICSHOPPER / {t('INTERVIEW COMPARISON', 'เทียบคำตอบและหน้าร้าน')}
			</span>
			<h1>{t('Same products. Different ways to shop.', 'สินค้าเดียวกัน เลือกดูได้ต่างกัน')}</h1>
			<p>
				{t(
					'Try the answers side by side. These are live store components, using the same source listings.',
					'ลองเทียบคำตอบข้างกัน แต่ละช่องใช้หน้าร้านจริงและข้อมูลสินค้าชุดเดียวกัน'
				)}
			</p>
		</div>
		<div class="header-actions">
			<button onclick={() => (locale = locale === 'th' ? 'en' : 'th')}>
				{locale === 'th' ? 'EN' : 'ไทย'}
			</button><button onclick={onclose}>{t('Back to my shop', 'กลับหน้าร้านของฉัน')}</button>
		</div>
	</header>
	<div class="toolbar">
		<label>
			<input type="checkbox" bind:checked={parts} />{t(
				'Show what controls each part',
				'ดูว่าแต่ละส่วนเปลี่ยนจากอะไร'
			)}
		</label>
	</div>
	<p class="explanation">
		{t(
			'These examples do not change your shop. Complete the interview in your shop to apply your choices.',
			'ตัวอย่างเหล่านี้ไม่เปลี่ยนหน้าร้านของคุณ ตอบคำถามในหน้าร้านเพื่อปรับหน้าร้านตามตัวเลือกของคุณ'
		)}
	</p>
	<div class="panes">
		{#each previews as preview (preview.id)}
			{@const plan = preview.result.plan}
			<section
				data-example={preview.id}
				class="pane shop-theme {plan.theme}"
				class:large={plan.theme === 'large-print'}
			>
				<header class="pane-header">
					<span class="eyebrow">{t('VIEW', 'มุมมอง')} {preview.id}</span>
					<h2>
						{plan.theme === 'large-print'
							? t('Easy reading', 'อ่านง่าย')
							: plan.layout === 'table'
								? t('Compare details', 'เทียบรายละเอียด')
								: t('Browse visually', 'เลือกจากรูป')}
					</h2>
					<p class="theme-source">
						{preview.answers.reading === 'large'
							? t('From the reading answer', 'ตามคำตอบเรื่องการอ่าน')
							: t('Default theme', 'ธีมเริ่มต้น')}:
						<strong>{preferenceName(plan.theme, locale)}</strong>
					</p>
				</header>
				<div class="answers-summary">
					{#each interview.questions as question (question.id)}<span>
							{question.options.find((o) => o.id === preview.answers[question.id as Question])?.[
								locale
							]}
						</span>{/each}
				</div>
				<details class="edit-answers">
					<summary>{t('Edit answers', 'แก้คำตอบ')}</summary>
					{#each interview.questions as question (question.id)}<label>
							{question[locale]}<select
								value={preview.answers[question.id as Question]}
								onchange={(event) =>
									change(preview.id, question.id as Question, event.currentTarget.value)}
							>
								{#each question.options as option (option.id)}<option value={option.id}>
										{option[locale]}
									</option>{/each}
							</select>
						</label>{/each}
				</details>
				{#if parts}<dl class="parts">
						{#each describePatch({ ...preview.result.patch, theme: plan.theme }, locale) as item (item.field)}<div>
								<dt>{item.label}</dt>
								<dd>
									{item.text}<small>
										{item.field === 'theme' && preview.answers.reading !== 'large'
											? t('Default theme', 'ธีมเริ่มต้น')
											: t('Explicit answer', 'คำตอบโดยตรง')}
									</small>
									{#if item.field === 'priorities'}<small>
											{t(
												'Not used for ranking: source scores unavailable.',
												'ยังไม่ใช้จัดอันดับ: ไม่มีคะแนนจากแหล่งข้อมูล'
											)}
										</small>{/if}
									{#if item.field === 'sections'}<small>
											{t(
												'Only sections with available source data are shown.',
												'แสดงเฉพาะส่วนที่มีข้อมูลจากแหล่งที่มา'
											)}
										</small>{/if}
								</dd>
							</div>{/each}
					</dl>{/if}
				<div class="shelf-preview">
					<ShopShelf
						{plan}
						{rows}
						{categories}
						onopen={(product: ShopListing) => (selected = product)}
					/>
				</div>
				<div class="pane-footer">
					{#if plan.details.includes('reviews')}<p class="unavailable">
							{t('Reviews unavailable', 'ยังไม่มีรีวิวที่ยืนยันได้')}
						</p>{/if}
					<p>
						{t(
							'Priority saved; this snapshot has no verified scores to re-rank products.',
							'บันทึกสิ่งสำคัญไว้ แต่ข้อมูลชุดนี้ไม่มีคะแนนที่ยืนยันได้เพื่อจัดอันดับใหม่'
						)}
					</p>
				</div>
			</section>
		{/each}
	</div>
	<p class="footnote">
		{t(
			'Prices and sizes come from the same source listings in every view.',
			'ราคาและขนาดสินค้าในทุกมุมมองมาจากรายการสินค้าต้นทางชุดเดียวกัน'
		)}
	</p>
	{#if selected}<Sheet
			title={t('Product details', 'รายละเอียดสินค้า')}
			onclose={() => (selected = null)}
		>
			<h2 {...catalogNameAttributes(selected, locale)}>{selected.name[locale]}</h2>
			{#if selected.size}<p data-fact-key={`${selected.id}:size`} data-raw={selected.size[locale]}>
					{selected.size[locale]}
				</p>{/if}
			{#if selected.price !== null}<p
					data-fact-key={`${selected.id}:shopPrice`}
					data-raw={selected.price}
				>
					{formatBaht(selected.price, locale)}
				</p>{:else}<p>{t('Price unavailable', 'ยังไม่มีราคาที่ตรวจสอบได้')}</p>{/if}
			{#if selected.sourceLabel}<p
					data-fact-key={`${selected.id}:sourceLabel`}
					data-raw={selected.sourceLabel[locale]}
				>
					{selected.sourceLabel[locale]}
				</p>{/if}
			<a href={selected.source} target="_blank" rel="noreferrer">
				{t('Open source listing', 'เปิดรายการต้นทาง')}
			</a>
		</Sheet>{/if}
</main>

<style>
	.interview-comparison {
		max-width: 1480px;
		margin: auto;
		padding: 32px;
		min-height: 100vh;
	}
	.comparison-header {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		align-items: start;
		border-bottom: 2px solid var(--ink);
		padding-bottom: 20px;
	}
	h1 {
		font-size: 30px;
		line-height: 1.25;
		margin: 8px 0;
		letter-spacing: -0.7px;
	}
	.comparison-header p {
		margin: 0;
		color: var(--muted);
	}
	.eyebrow {
		font-size: 12px;
		letter-spacing: 0.08em;
	}
	.header-actions {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}
	button {
		color: var(--ink);
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 4px;
		padding: 8px 12px;
	}
	.toolbar {
		display: flex;
		gap: 24px;
		flex-wrap: wrap;
		padding-top: 12px;
	}
	.toolbar label {
		display: flex;
		gap: 8px;
		align-items: center;
		min-height: 48px;
		cursor: pointer;
	}
	input {
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
	}
	.explanation {
		font-size: 14px;
		color: var(--muted);
		margin: 0 0 24px;
	}
	.panes {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 20px;
		align-items: start;
	}
	.pane {
		min-width: 0;
		border: 1px solid var(--line);
		border-top: 3px solid var(--accent);
	}
	.pane-header {
		padding: 20px 20px 8px;
	}
	h2 {
		margin: 4px 0;
		font-size: 24px;
	}
	.theme-source {
		margin: 8px 0;
		font-size: 14px;
		color: var(--muted);
	}
	.theme-source strong {
		color: var(--accent);
	}
	.answers-summary {
		padding: 0 20px 8px;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		min-height: 54px;
		font-size: 14px;
	}
	.answers-summary span:not(:last-child)::after {
		content: ' /';
		color: var(--muted);
		margin-left: 8px;
	}
	.edit-answers {
		margin: 0 20px 12px;
	}
	summary {
		cursor: pointer;
		min-height: 44px;
		padding: 8px 0;
		text-decoration: underline;
	}
	.edit-answers label {
		display: grid;
		gap: 6px;
		margin: 12px 0;
	}
	select {
		min-width: 0;
		width: 100%;
		padding: 10px;
		border: 1px solid var(--muted);
		color: var(--ink);
		background: var(--surface);
	}
	.shelf-preview {
		padding: 0 16px 16px;
	}
	.parts {
		margin: 0 20px 20px;
		border-top: 1px dashed var(--muted);
		font-size: 14px;
	}
	.parts div {
		padding: 10px 0;
		border-bottom: 1px dotted var(--line);
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 12px;
	}
	.parts dd {
		margin: 0;
		font-weight: 600;
	}
	.parts small {
		display: block;
		font-weight: 400;
		color: var(--muted);
	}
	.pane-footer {
		padding: 16px;
		border-top: 1px solid var(--line);
	}
	.pane-footer p,
	.pane-footer small {
		font-size: 13px;
		color: var(--muted);
	}
	.pane-footer p {
		margin: 0 0 12px;
	}
	.footnote {
		color: var(--muted);
		font-size: 13px;
		margin-top: 24px;
		max-width: 900px;
	}
	.large
		:is(
			.eyebrow,
			.theme-source,
			.answers-summary,
			summary,
			.pane-footer p,
			.pane-footer small,
			.parts,
			.parts small
		) {
		font-size: 20px;
	}
	.large :global(.body),
	.large :global(.spec-label) {
		font-size: 20px;
	}
	.large :global(.picture) {
		max-height: 160px;
	}
	.large :global(.picture img) {
		height: 160px;
	}
	.large :global(.open),
	.large :global(h3 button) {
		font-size: 20px;
	}
	@media (max-width: 1000px) {
		.panes {
			grid-template-columns: 1fr;
		}
		.interview-comparison {
			max-width: 600px;
			padding: 20px 16px;
		}
		.comparison-header {
			flex-direction: column;
			gap: 16px;
		}
		h1 {
			font-size: 26px;
		}
		.toolbar {
			gap: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		* {
			scroll-behavior: auto;
			animation: none;
			transition: none;
		}
	}
</style>
