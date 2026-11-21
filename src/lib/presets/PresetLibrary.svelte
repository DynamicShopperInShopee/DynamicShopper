<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Locale } from '../catalog';
	import MarketplaceBrand from '../storefront/MarketplaceBrand.svelte';
	import '../storefront/theme.css';
	import { parts, blockNames } from './parts';
	import PresetCanvas from './PresetCanvas.svelte';
	import PresetExamples from './PresetExamples.svelte';
	let locale = $state<Locale>('th');
	let interactive = $state(false);
	onMount(() => {
		interactive = true;
	});
	let theme = $state('standard');
	let width = $state('fluid');
	let dataState = $state<'ready' | 'empty' | 'loading' | 'error'>('ready');
	const t = (en: string, th: string) => (locale === 'th' ? th : en);
	const requested = $derived(page.url.searchParams.get('module'));
	const part = $derived(parts.find((p) => p.recipes.some((r) => r.id === requested)) ?? parts[0]);
	const recipe = $derived(part.recipes.find((r) => r.id === requested) ?? part.recipes[0]);
	const total = parts.reduce((sum, p) => sum + p.recipes.length, 0);
	const themes = $derived([
		{ value: 'standard', label: t('Standard', 'มาตรฐาน') },
		{ value: 'minimal', label: t('Minimal', 'เรียบง่าย') },
		{ value: 'vibrant', label: t('Vibrant', 'สีสัน') },
		{ value: 'large-print', label: t('Large print', 'ตัวอักษรใหญ่') }
	]);
	function choose(id: string) {
		dataState = 'ready';
		void goto(resolve(`/presets?module=${encodeURIComponent(id)}`), {
			replace: true,
			reset: false
		});
	}
</script>

<svelte:head><title>{t('UI preset library', 'คลังชิ้นส่วน UI')} · DynamicShopper</title></svelte:head>
<div data-storefront-theme={theme} class="library">
	<MarketplaceBrand
		{locale}
		showControls={true}
		enabled={interactive}
		{theme}
		{themes}
		ontheme={(value: string) => (theme = value)}
		onlocale={() => (locale = locale === 'th' ? 'en' : 'th')}
	/>
	<main>
		<a class="back" href={resolve('/')}>{t('Back to the store', 'กลับหน้าร้าน')}</a>
		<header class="intro">
			<div>
				<h1>{t('Storefront preset library', 'คลังรูปแบบหน้าร้าน')}</h1>
				<p>
					{t(
						'Choose a section and a module to preview it.',
						'เลือกส่วนของหน้าร้าน แล้วเลือกชิ้นส่วนที่ต้องการดู'
					)}
				</p>
			</div>
			<p class="count">
				<strong>{total}</strong><span>
					{t('modules across', 'ชิ้นส่วน ใน')}
					{parts.length}
					{t('website parts', 'ส่วนของเว็บไซต์')}
				</span>
			</p>
		</header>
		<div class="workspace" inert={!interactive}>
			<nav class="parts" aria-label={t('Website parts', 'ส่วนของเว็บไซต์')}>
				{#each parts as item (item.id)}<button
						aria-current={part.id === item.id ? 'page' : undefined}
						onclick={() => choose(item.recipes[0].id)}
					>
						<span>{item.title[locale]}</span><small>{item.recipes.length}</small>
					</button>{/each}
			</nav>
			<div class="content">
				<div class="part-heading">
					<h2>{part.title[locale]}</h2>
					<p>{part.purpose[locale]}</p>
				</div>
				<div class="modules" role="group" aria-label={t('Modules in this part', 'ชิ้นส่วนในหมวดนี้')}>
					{#each part.recipes as item (item.id)}<button
							aria-pressed={recipe.id === item.id}
							onclick={() => choose(item.id)}
						>
							<span class="diagram {item.arrangement}" aria-hidden="true">
								{#each item.blocks as block (block)}<i></i>{/each}
							</span><span>{item.title[locale]}</span>
						</button>{/each}
				</div>
				<section class="selected" aria-label={t('Selected module', 'ชิ้นส่วนที่เลือก')}>
					<div class="toolbar">
						<div>
							<small>{recipe.id}</small>
							<h3>{recipe.title[locale]}</h3>
						</div>
						<div class="controls">
							<label>
								{t('Width', 'ความกว้าง')}<select bind:value={width}>
									<option value="fluid">{t('Flexible', 'ตามพื้นที่')}</option><option value="phone">
										{t('Phone', 'มือถือ')}
									</option>
								</select>
							</label><label>
								{t('Data state', 'สถานะข้อมูล')}<select bind:value={dataState}>
									<option value="ready">{t('Default', 'ปกติ')}</option><option value="empty">
										{t('Empty', 'ไม่มีข้อมูล')}
									</option><option value="loading">{t('Loading', 'กำลังโหลด')}</option><option
										value="error"
									>
										{t('Error', 'โหลดไม่สำเร็จ')}
									</option>
								</select>
							</label>
						</div>
					</div>
					<div class="stage">
						<div class="surface" class:phone={width === 'phone'}>
							{#key recipe.id}<PresetCanvas
									{theme}
									{recipe}
									{locale}
									{dataState}
									onready={() => (dataState = 'ready')}
								/>{/key}
						</div>
					</div>
					<div class="brief">
						<div>
							<h4>{t('Shopper need', 'ความต้องการที่รองรับ')}</h4>
							<p>{recipe.need[locale]}</p>
							<h4>{t('Use when', 'ใช้เมื่อ')}</h4>
							<p>{recipe.trigger[locale]}</p>
						</div>
						<div>
							<h4>{t('Information order', 'ลำดับข้อมูล')}</h4>
							<ol>
								{#each recipe.blocks as block (block)}<li>{blockNames[block][locale]}</li>{/each}
							</ol>
						</div>
						<div>
							<h4>{t('Data dependency', 'ข้อมูลที่ต้องใช้')}</h4>
							<p>{recipe.dependency[locale]}</p>
							<p>
								{recipe.availability === 'service'
									? t(
											'Layout prepared; this service needs its real data connection.',
											'เตรียมแบบจัดวางแล้ว บริการนี้ยังต้องเชื่อมข้อมูลจริง'
										)
									: t(
											'Uses shared catalog, pricing or presentation controls.',
											'ใช้แค็ตตาล็อก ระบบราคา หรือการตั้งค่าการแสดงผลร่วม'
										)}
							</p>
						</div>
					</div>
				</section>
				<p class="footnote">
					{t(
						'Examples use the catalog. Modules that require an additional service are labeled in their descriptions.',
						'ตัวอย่างใช้ข้อมูลจากแค็ตตาล็อก ชิ้นส่วนที่ต้องเชื่อมบริการเพิ่มเติมจะระบุไว้ในคำอธิบาย'
					)}
				</p>
			</div>
		</div>
		<PresetExamples {locale} {interactive} />
	</main>
</div>

<style>
	.library {
		min-height: 100dvh;
		--accent: #a62d15;
		--on-accent: white;
		--small: var(--storefront-small);
		--size: var(--storefront-text);
		line-height: 1.55;
	}
	main {
		width: min(1280px, calc(100% - 48px));
		margin: 0 auto;
		padding-bottom: 48px;
	}
	.back {
		display: inline-flex;
		min-height: 48px;
		align-items: center;
		color: var(--accent);
		text-underline-offset: 4px;
	}
	.intro {
		display: flex;
		justify-content: space-between;
		gap: 32px;
		align-items: center;
		margin: 20px 0 32px;
	}
	h1 {
		font-size: clamp(26px, 3vw, 36px);
		line-height: 1.3;
		max-width: 800px;
		margin: 8px 0 12px;
		font-weight: 600;
	}
	h2 {
		font-size: 24px;
		margin: 0 0 8px;
	}
	h3 {
		font-size: max(20px, var(--storefront-text));
		margin: 4px 0 0;
	}
	h4 {
		margin: 0 0 8px;
		font-size: inherit;
	}
	p {
		margin: 0 0 12px;
	}
	.footnote,
	small {
		color: var(--muted);
		font-size: max(13px, var(--storefront-small));
	}
	.count {
		min-width: 150px;
		border-left: 1px solid var(--seam);
		padding-left: 24px;
	}
	.count strong {
		display: block;
		font-size: 48px;
		font-family: var(--mono);
		line-height: 1.2;
		font-weight: 500;
	}
	.count span {
		display: block;
		color: var(--muted);
	}
	.workspace {
		display: grid;
		grid-template-columns: 230px minmax(0, 1fr);
		gap: 32px;
		align-items: start;
	}
	.parts {
		display: grid;
		gap: 4px;
		position: sticky;
		top: 16px;
	}
	button,
	select {
		font: inherit;
		min-height: var(--tap);
		padding: 10px 12px;
		cursor: pointer;
		color: inherit;
		background: var(--surface);
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		min-width: 0;
	}
	.parts button {
		display: flex;
		text-align: start;
		justify-content: space-between;
		align-items: start;
		gap: 12px;
		border-color: transparent;
		background: transparent;
	}
	[aria-current='page'],
	[aria-pressed='true'] {
		color: var(--accent);
		border-color: var(--accent) !important;
		background: var(--surface) !important;
	}
	:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
	.content {
		min-width: 0;
	}
	.part-heading p {
		color: var(--muted);
	}
	.modules {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		margin: 20px 0 28px;
	}
	.modules button {
		display: flex;
		align-items: center;
		text-align: start;
		gap: 12px;
		overflow-wrap: anywhere;
	}
	.diagram {
		width: 44px;
		height: 36px;
		flex: none;
		display: grid;
		gap: 3px;
		padding: 4px;
		border: 1px solid var(--seam);
	}
	.diagram i {
		background: var(--seam);
		border-top: 1px solid var(--muted);
	}
	.diagram.split,
	.diagram.tiles {
		grid-template-columns: 1fr 1fr;
	}
	.diagram.rail {
		grid-auto-flow: column;
	}
	.diagram.focus i:first-child {
		grid-column: 1/-1;
	}
	.selected {
		border: 1px solid var(--seam);
		background: var(--surface);
	}
	.toolbar {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		align-items: center;
		padding: 20px;
		flex-wrap: wrap;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	label {
		display: grid;
		gap: 4px;
	}
	.stage {
		padding: 16px;
		background: var(--seam);
	}
	.surface {
		min-width: 0;
		width: 100%;
		margin-inline: auto;
	}
	.surface.phone {
		width: min(390px, 100%);
	}
	.brief {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 24px;
		padding: 24px;
	}
	.brief p,
	.brief ol {
		color: var(--muted);
		margin: 0 0 20px;
		overflow-wrap: anywhere;
	}
	ol {
		padding-left: 20px;
	}
	.footnote {
		margin-top: 16px;
	}
	@media (max-width: 1050px) {
		.workspace {
			grid-template-columns: 190px minmax(0, 1fr);
			gap: 20px;
		}
		.modules {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.brief {
			grid-template-columns: 1fr;
			gap: 0;
		}
	}
	@media (max-width: 700px) {
		main {
			width: calc(100% - 24px);
		}
		.intro {
			display: block;
			margin: 4px 0 16px;
		}
		.count {
			display: flex;
			gap: 16px;
			align-items: center;
			padding: 0;
			border: 0;
			margin-top: 8px;
		}
		.count strong {
			font-size: 36px;
		}
		.workspace {
			grid-template-columns: minmax(0, 1fr);
		}
		.parts,
		.modules {
			position: static;
			display: flex;
			gap: 8px;
			overflow-x: auto;
			scroll-padding-inline: 4px;
			padding: 4px;
			scrollbar-width: thin;
		}
		.parts button,
		.modules button {
			flex: none;
			max-width: 80%;
		}
		.modules {
			margin: 8px 0 16px;
		}
		.modules .diagram {
			display: none;
		}
		.stage {
			padding: 8px;
		}
		.toolbar,
		.brief {
			padding: 16px;
		}
	}
</style>
