<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Official external reference. */
	import RecipePreview from './RecipePreview.svelte';
	import Icon from './Icon.svelte';
	import { parts, blockNames, dependencies } from './parts-library';
	import type { CatalogSnapshot } from '../catalog-api/types';
	let {
		lang: initialLang,
		catalog,
		onclose
	}: { lang: 'en' | 'th'; catalog: CatalogSnapshot; onclose: () => void } = $props();
	let chosenLang = $state<'en' | 'th' | null>(null);
	const lang = $derived(chosenLang ?? initialLang);
	let partId = $state(parts[0].id);
	let variant = $state(0);
	let previewWidth = $state('desktop');
	const part = $derived(parts.find((p) => p.id === partId) ?? parts[0]);
	const recipe = $derived(part.recipes[variant] ?? part.recipes[0]);
	const total = parts.reduce((n, p) => n + p.recipes.length, 0);
	const t = (en: string, th: string) => (lang === 'th' ? th : en);
</script>

<main class="parts-library" {lang}>
	<header class="library-header">
		<button class="back" onclick={onclose}>
			<Icon name="home" size={20} />{t('Back to shop', 'กลับหน้าร้าน')}
		</button><strong>DynamicShopper <span>/ {t('UI parts', 'ชิ้นส่วน UI')}</span></strong><button
			onclick={() => (chosenLang = lang === 'th' ? 'en' : 'th')}
		>
			{lang === 'th' ? 'EN' : 'ไทย'}
		</button>
	</header>
	<div class="library-intro">
		<div>
			<p>{t('DESIGN WORKSPACE', 'พื้นที่ออกแบบ')}</p>
			<h1>{t('A familiar shop. Many ways to choose.', 'เริ่มจากร้านที่คุ้นเคย เลือกมุมมองที่เหมาะกับคุณ')}</h1>
			<p>
				{t(
					'Explore authored arrangements for each part of the shopping journey. The real shop starts with the marketplace baseline.',
					'เลือกดูแบบจัดวางในแต่ละส่วนของการเลือกซื้อ หน้าร้านจริงเริ่มจากโครงสร้าง marketplace มาตรฐานเสมอ'
				)}
			</p>
		</div>
		<div class="library-count">
			<strong>{total}</strong><span>
				{t('arrangements', 'แบบจัดวาง')} · {parts.length}
				{t('parts', 'ส่วน')}
			</span>
		</div>
	</div>
	<div class="library-layout">
		<nav class="part-nav" aria-label={t('Website parts', 'ส่วนต่าง ๆ ของเว็บไซต์')}>
			{#each parts as item, index (item.id)}<button
					aria-current={partId === item.id ? 'page' : undefined}
					onclick={() => {
						partId = item.id;
						variant = 0;
					}}
				>
					<span>{String(index + 1).padStart(2, '0')}</span>{item.title[lang]}<small>
						{item.recipes.length}
					</small>
				</button>{/each}
		</nav>
		<div class="library-main">
			<div class="part-intro">
				<h2>{part.title[lang]}</h2>
				<p>{part.purpose[lang]}</p>
			</div>
			<div class="recipe-picker" aria-label={t('Layout variants', 'แบบจัดวาง')}>
				{#each part.recipes as item, index (item.id)}<button
						aria-pressed={variant === index}
						onclick={() => (variant = index)}
					>
						<span class="mini-layout mini-{item.arrangement}" aria-hidden="true">
							{#each item.blocks as block (block)}<i class:missing={dependencies.has(block)}
								></i>{/each}
						</span><span>{item.title[lang]}</span><small>{item.id}</small>
					</button>{/each}
			</div>
			<div class="preview-toolbar">
				<div>
					<span>{recipe.id}</span>
					<h3>{recipe.title[lang]}</h3>
				</div>
				<label>
					{t('Preview width', 'ความกว้างตัวอย่าง')}<select bind:value={previewWidth}>
						<option value="desktop">{t('Desktop', 'เดสก์ท็อป')}</option><option value="phone">
							{t('Phone', 'มือถือ')}
						</option>
					</select>
				</label>
			</div>
			<div class="preview-and-brief">
				<div class="preview-stage">
					<div class="preview-canvas" class:phone-width={previewWidth === 'phone'}>
						{#key recipe.id}<RecipePreview {recipe} {lang} {catalog} />{/key}
					</div>
					<p class="preview-caption">
						{t(
							'Interactive design preview · changes stay inside this workspace.',
							'ตัวอย่างแบบออกแบบที่ทดลองได้ · การเปลี่ยนแปลงอยู่เฉพาะพื้นที่นี้'
						)}
					</p>
				</div>
				<aside class="recipe-brief">
					<h3>{t('When this helps', 'เหมาะกับจังหวะไหน')}</h3>
					<p>{recipe.need[lang]}</p>
					<h4>{t('Use when', 'ใช้เมื่อ')}</h4>
					<p>{recipe.trigger[lang]}</p>
					<h4>{t('Information order', 'ลำดับข้อมูล')}</h4>
					<ol>
						{#each recipe.blocks as block (block)}<li>{blockNames[block][lang]}</li>{/each}
					</ol>
					<h4>{t('Required data', 'ข้อมูลที่ต้องใช้')}</h4>
					<p>{part.dependency[lang]}</p>
					<div class="source-reference">
						<a href={catalog.snapshot.source} target="_blank" rel="noreferrer">
							{t('Catalog source reference', 'แหล่งอ้างอิงสินค้า')}
							<Icon name="arrow" size={16} />
						</a>
						<p>
							{t(
								'Reference structure observed on 21 Nov 2026. New arrangements are design proposals; unavailable service blocks are shown as empty states.',
								'อ้างอิงโครงหน้าร้านเมื่อ 21 พ.ย. 2026 แบบใหม่เป็นข้อเสนอออกแบบ ส่วนที่ยังไม่มีระบบใช้สถานะรอข้อมูล'
							)}
						</p>
					</div>
				</aside>
			</div>
		</div>
	</div>
</main>

<style>
	.parts-library {
		background: #fafaf9;
		color: #262626;
		min-height: 100dvh;
		font-family: 'IBM Plex Sans Thai', sans-serif;
		line-height: 1.5;
	}
	.parts-library :is(button, select) {
		font: inherit;
		min-height: 44px;
		cursor: pointer;
		padding: 8px 12px;
		color: inherit;
		border: 1px solid #dededb;
		background: white;
		border-radius: 3px;
	}
	.parts-library :focus-visible {
		outline: 2px solid #b63113;
		outline-offset: 3px;
	}
	.library-header {
		display: flex;
		gap: 20px;
		justify-content: space-between;
		align-items: center;
		padding: 14px 32px;
		border-bottom: 1px solid #dededb;
		background: white;
	}
	.library-header strong {
		flex: 1;
		font-size: 17px;
	}
	.library-header strong span {
		font-weight: 400;
		color: #656565;
	}
	.library-header .back {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 0;
	}
	.library-intro {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 40px;
		padding: 32px;
		border-bottom: 1px solid #dededb;
	}
	.library-intro h1 {
		font-size: 26px;
		line-height: 1.4;
		margin: 6px 0 12px;
		font-weight: 600;
	}
	.library-intro p {
		font-size: 14px;
		color: #656565;
		margin: 0;
		max-width: 800px;
	}
	.library-intro > div > p:first-child {
		font-size: 12px;
		letter-spacing: 0.06em;
		color: #a73015;
	}
	.library-count {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		text-align: right;
	}
	.library-count strong {
		font:
			500 36px 'IBM Plex Mono',
			monospace;
	}
	.library-count span {
		font-size: 13px;
		color: #656565;
	}
	.library-layout {
		display: grid;
		grid-template-columns: 244px minmax(0, 1fr);
	}
	.part-nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 24px 12px;
		border-right: 1px solid #dededb;
		background: white;
		align-self: start;
		position: sticky;
		top: 0;
	}
	.part-nav button {
		border: 0;
		background: transparent;
		text-align: left;
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 13px;
	}
	.part-nav button > span {
		color: #767676;
		font:
			12px 'IBM Plex Mono',
			monospace;
	}
	.part-nav button > small {
		margin-left: auto;
		color: #656565;
	}
	.part-nav [aria-current='page'] {
		background: #fff0e9;
		color: #a73015;
		font-weight: 600;
	}
	.library-main {
		padding: 26px;
		min-width: 0;
	}
	.part-intro h2 {
		font-size: 24px;
		margin: 0 0 6px;
		font-weight: 600;
	}
	.part-intro p {
		font-size: 14px;
		color: #656565;
		margin: 0 0 22px;
	}
	.recipe-picker {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 8px;
	}
	.recipe-picker button {
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: stretch;
		text-align: left;
		font-size: 12px;
		padding: 10px;
	}
	.recipe-picker button[aria-pressed='true'] {
		border-color: #b63113;
		background: #fff6f2;
	}
	.recipe-picker button > span:not(.mini-layout) {
		min-height: 36px;
	}
	.recipe-picker small {
		color: #656565;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 10px;
	}
	.mini-layout {
		height: 42px;
		display: grid;
		gap: 3px;
		padding: 4px;
		background: #f1f0ed;
	}
	.mini-layout i {
		display: block;
		background: #d4d2cb;
		min-height: 4px;
		border: 1px solid #d4d2cb;
	}
	.mini-layout i:first-child {
		background: #d98269;
		border-color: #d98269;
	}
	.mini-layout .missing {
		border: 1px dashed #8a8880;
		background: transparent;
	}
	.mini-split,
	.mini-tiles {
		grid-template-columns: 1fr 1fr;
	}
	.mini-split i:first-child {
		grid-row: span 2;
	}
	.mini-focus i:first-child {
		flex: 3;
	}
	.mini-focus {
		display: flex;
		flex-direction: column;
	}
	.mini-focus i {
		flex: 1;
	}
	.mini-receipt {
		padding-inline: 22%;
	}
	.mini-rail {
		grid-auto-flow: column;
	}
	.preview-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 26px 0 14px;
	}
	.preview-toolbar h3 {
		margin: 4px 0 0;
		font-size: 18px;
		font-weight: 600;
	}
	.preview-toolbar span {
		font:
			11px 'IBM Plex Mono',
			monospace;
		color: #656565;
	}
	.preview-toolbar label {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
	}
	.preview-and-brief {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 240px;
		gap: 20px;
		align-items: start;
	}
	.preview-stage {
		min-width: 0;
		background: #ecece9;
		padding: 12px;
	}
	.preview-canvas {
		width: 100%;
		margin-inline: auto;
		border: 1px solid #d8d8d5;
		container-type: inline-size;
	}
	.preview-canvas.phone-width {
		max-width: 390px;
	}
	.preview-caption {
		color: #656565;
		font-size: 12px;
		padding: 12px 2px 0;
		margin: 0;
	}
	.recipe-brief {
		padding: 20px;
		background: white;
		border: 1px solid #dededb;
		font-size: 13px;
	}
	.recipe-brief h3 {
		font-size: 16px;
		margin: 0 0 10px;
	}
	.recipe-brief h4 {
		font-size: 12px;
		color: #656565;
		margin: 24px 0 8px;
	}
	.recipe-brief p {
		margin: 0;
	}
	.recipe-brief ol {
		padding-left: 18px;
		margin: 0;
	}
	.recipe-brief li {
		padding-bottom: 6px;
	}
	.source-reference {
		margin-top: 24px;
		padding-top: 16px;
		border-top: 1px solid #dededb;
	}
	.source-reference a {
		color: #a73015;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		text-underline-offset: 4px;
	}
	.source-reference p {
		font-size: 12px;
		color: #656565;
		margin-top: 8px;
	}
	@media (max-width: 1150px) {
		.recipe-picker {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
		.preview-and-brief {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 700px) {
		.library-header {
			padding: 10px 12px;
			gap: 8px;
			flex-wrap: wrap;
		}
		.library-header strong {
			font-size: 14px;
		}
		.library-header strong span {
			display: none;
		}
		.library-header .back {
			font-size: 12px;
			padding: 8px 0;
		}
		.library-intro {
			padding: 24px 16px;
			gap: 16px;
			align-items: flex-start;
		}
		.library-intro h1 {
			font-size: 21px;
		}
		.library-count {
			display: none;
		}
		.library-layout {
			grid-template-columns: 1fr;
		}
		.part-nav {
			position: static;
			display: grid;
			grid-template-columns: 1fr 1fr;
			padding: 12px;
			border-right: 0;
			border-bottom: 1px solid #dededb;
		}
		.part-nav button {
			font-size: 12px;
			gap: 6px;
			padding: 8px 6px;
		}
		.part-nav button small {
			display: none;
		}
		.library-main {
			padding: 20px 12px;
		}
		.part-intro h2 {
			font-size: 22px;
		}
		.recipe-picker {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 6px;
		}
		.recipe-picker button {
			padding: 7px;
			font-size: 12px;
		}
		.recipe-picker button > span:not(.mini-layout) {
			min-height: 48px;
		}
		.recipe-picker small {
			font-size: 9px;
			overflow-wrap: anywhere;
		}
		.preview-toolbar {
			flex-wrap: wrap;
		}
		.preview-stage {
			padding: 6px;
		}
	}
</style>
