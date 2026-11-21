<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- All links are external source URLs; this component also runs without SvelteKit in the standalone preview. */
	import '../assets/fonts/plex.css';
	import './marketplace.css';
	import Icon from './Icon.svelte';
	import ShopShelf from './ShopShelf.svelte';
	import InterviewCompare from './InterviewCompare.svelte';
	import Sheet from './Sheet.svelte';
	import Interview from './Interview.svelte';
	import PartsLibrary from './PartsLibrary.svelte';
	import { tick, onMount } from 'svelte';
	import { describePatch, type Answers } from '../personalization/interview';
	import { listings, shopSource, retrieved } from './shop-data';
	import type { ShopListing, CatalogSnapshot } from '../catalog-api/types';
	import { fetchCatalogSnapshot, readCatalogCache, writeCatalogCache } from '../catalog-api/client';
	import {
		initialView,
		visibleListings,
		interpret,
		applyInterview,
		removeInterviewPreference,
		resetView,
		type View
	} from './engine';
	import { formatBaht } from '../catalog';
	let view = $state(initialView());
	let history = $state<View[]>([]);
	let query = $state('');
	let saved = $state<string[]>([]);
	let tab = $state('shop');
	let sheet = $state<'assistant' | 'product' | 'interview' | 'filters' | null>(null);
	const starterCategories = [...new Set(listings.map((item) => item.category))].map((id) => ({
		id,
		name:
			id === 'laundry'
				? { en: 'Laundry care', th: 'ดูแลเสื้อผ้า' }
				: id === 'dishes'
					? { en: 'Kitchen care', th: 'ดูแลครัว' }
					: { en: id, th: id },
		count: listings.filter((item) => item.category === id).length
	}));
	let catalog = $state<CatalogSnapshot>({
		items: listings,
		categories: starterCategories,
		snapshot: {
			id: 'starter-seven',
			source: shopSource,
			observedAt: retrieved,
			importedAt: retrieved,
			total: listings.length
		}
	});
	let catalogStatus = $state<'loading' | 'backend' | 'cached' | 'fallback'>('loading');
	let focus = $state<ShopListing>(listings[0]);
	let message = $state('');
	let budget = $state<number | undefined>();
	let chat = $state<{ role: 'user' | 'assistant'; text: string }[]>([]);
	let reply = $state('');
	let outcome = $state<'ask' | 'deal' | null>(null);
	let changed = $state(false);
	let comparisonOpen = $state(false);
	let libraryOpen = $state(false);
	let shopHome = $state(false);
	onMount(() => {
		const route = new URL(window.location.href).searchParams.get('view');
		comparisonOpen = route === 'interviews';
		libraryOpen = route === 'parts';
		try {
			const cached = readCatalogCache(window.localStorage);
			if (cached) {
				catalog = cached;
				catalogStatus = 'cached';
			}
		} catch {
			/* Browser storage may be disabled. */
		}
		const request = new AbortController();
		const timeout = setTimeout(() => request.abort(), 8000);
		let active = true;
		fetchCatalogSnapshot(request.signal)
			.then((next) => {
				if (!active) return;
				catalog = next;
				catalogStatus = 'backend';
				try {
					writeCatalogCache(window.localStorage, next);
				} catch {
					/* Optional offline cache. */
				}
			})
			.catch(() => {
				if (active && catalogStatus !== 'cached') catalogStatus = 'fallback';
			})
			.finally(() => clearTimeout(timeout));
		return () => {
			active = false;
			request.abort();
			clearTimeout(timeout);
		};
	});
	function showLibrary(show: boolean) {
		libraryOpen = show;
		const url = new URL(window.location.href);
		if (show) url.searchParams.set('view', 'parts');
		else url.searchParams.delete('view');
		window.history.replaceState(window.history.state, '', url);
	}
	function showComparison(show: boolean) {
		comparisonOpen = show;
		const url = new URL(window.location.href);
		if (show) url.searchParams.set('view', 'interviews');
		else url.searchParams.delete('view');
		window.history.replaceState(window.history.state, '', url);
	}
	let shelf = $state<HTMLDivElement>();
	let interviewReceipt = $state<HTMLElement>();
	const lang = $derived(view.plan.locale);
	const t = (en: string, th: string) => (lang === 'th' ? th : en);
	let rows = $derived(
		visibleListings(view, query, catalog.items).filter(
			(p) => tab !== 'saved' || saved.includes(p.id)
		)
	);
	const categories = $derived([
		{ id: 'all', name: { en: 'All products', th: 'สินค้าทั้งหมด' }, count: catalog.items.length },
		...catalog.categories
	]);
	const catalogMessage = $derived(
		catalogStatus === 'backend'
			? t('Catalog loaded', 'โหลดข้อมูลสินค้าแล้ว')
			: catalogStatus === 'cached'
				? t('Saved offline catalog', 'ข้อมูลสินค้าที่บันทึกไว้สำหรับออฟไลน์')
				: catalogStatus === 'loading'
					? t('Loading full catalog…', 'กำลังโหลดข้อมูลสินค้าทั้งหมด…')
					: t(
							'Showing the starter catalog; full catalog unavailable.',
							'แสดงรายการเริ่มต้น ยังโหลดข้อมูลสินค้าทั้งหมดไม่ได้'
						)
	);
	const interviewChanges = $derived(
		describePatch(
			Object.fromEntries(
				Object.entries(view.interview?.applied ?? {}).filter(
					([key, value]) =>
						JSON.stringify(view.plan[key as keyof View['plan']]) === JSON.stringify(value) &&
						JSON.stringify(view.interview?.before[key as keyof View['plan']]) !==
							JSON.stringify(value)
				)
			),
			lang
		)
	);
	async function finishInterview(answers: Answers) {
		const next = applyInterview($state.snapshot(view), answers);
		apply(next, JSON.stringify(next.plan) !== JSON.stringify(view.plan));
		sheet = null;
		await tick();
		const target = interviewReceipt ?? shelf;
		target?.scrollIntoView({ block: 'start', behavior: 'instant' });
		target?.focus({ preventScroll: true });
	}
	function apply(next: View, recordHistory = true) {
		if (JSON.stringify(view) === JSON.stringify(next)) return;
		// Interview controls can change without changing the displayed store.
		if (recordHistory) {
			history = [...history, structuredClone($state.snapshot(view))];
			changed = true;
		}
		const filtersChanged =
			next.category !== view.category ||
			next.order !== view.order ||
			next.plan.maxPrice !== view.plan.maxPrice;
		view = filtersChanged ? { ...next, page: 1 } : next;
		budget = next.plan.maxPrice ?? undefined;
	}
	function undo() {
		const previous = history.at(-1);
		if (previous) {
			view = previous;
			budget = previous.plan.maxPrice ?? undefined;
			history = history.slice(0, -1);
			changed = history.length > 0;
		}
	}
	function open(p: ShopListing) {
		focus = p;
		outcome = null;
		sheet = 'product';
	}
	function send() {
		const request = message.trim();
		if (!request) return;
		const result = interpret(message, view);
		outcome = null;
		if (result.intent === 'change') {
			apply(result.state);
			reply = t('Your view is updated. You can undo this change.', 'ปรับมุมมองแล้ว ย้อนกลับได้เสมอ');
		} else if (result.intent === 'undo') {
			undo();
			reply = t('Previous view restored.', 'คืนมุมมองก่อนหน้าแล้ว');
		} else if (result.intent === 'reset') {
			apply(resetView(view));
			reply = t('Default view restored.', 'คืนมุมมองเริ่มต้นแล้ว');
		} else if (result.intent === 'ask') {
			outcome = 'ask';
			reply = t(
				'Open a product to check its sourced listing. Other claims cannot be confirmed.',
				'เปิดสินค้าเพื่อดูข้อมูลจากแหล่งที่มา ยังยืนยันคำกล่าวอ้างอื่นไม่ได้'
			);
		} else if (result.intent === 'deal') {
			outcome = 'deal';
			reply = t(
				'A final deal cannot be calculated without confirmed voucher and shipping terms.',
				'ยังคำนวณดีลสุดท้ายไม่ได้ เนื่องจากไม่มีเงื่อนไขโค้ดและค่าจัดส่งที่ยืนยันแล้ว'
			);
		} else
			reply = t(
				'Try “compare”, “large text”, or a budget request.',
				'ลองพิมพ์ “เปรียบเทียบ” “ตัวอักษรใหญ่” หรือระบุงบ'
			);
		chat = [...chat, { role: 'user', text: request }, { role: 'assistant', text: reply }];
		message = '';
	}
	function setCategory(category: View['category']) {
		tab = 'shop';
		shopHome = false;
		apply({ ...view, category });
	}
	function applyBudget() {
		const value = Number(budget);
		if (budget !== undefined && (!Number.isFinite(value) || value < 1)) return;
		apply({
			...view,
			plan: { ...view.plan, maxPrice: budget !== undefined ? Math.floor(value) : null }
		});
		sheet = null;
	}
</script>

{#if libraryOpen}
	<PartsLibrary {lang} {catalog} onclose={() => showLibrary(false)} />
{:else if comparisonOpen}
	<InterviewCompare
		{lang}
		rows={catalog.items}
		categories={catalog.categories}
		onclose={() => showComparison(false)}
	/>
{:else}
	<div
		class="phone {view.plan.theme}"
		class:marketplace={view.plan.theme === 'standard'}
		class:large={view.plan.theme === 'large-print'}
		{lang}
	>
		<a class="skip-link" href="#shop-products">{t('Skip to products', 'ข้ามไปยังสินค้า')}</a>
		<header class="market-header">
			<div class="utility wrap">
				<span>DynamicShopper · {t('Shopping prototype', 'ต้นแบบการเลือกซื้อ')}</span>
				<div>
					<a href="https://help.shopee.co.th/th/s" target="_blank" rel="noreferrer">
						{t('Shopee help', 'ศูนย์ช่วยเหลือ Shopee')}
					</a>
					<a href={catalog.snapshot.source} target="_blank" rel="noreferrer">
						{t('Catalog source', 'แหล่งข้อมูลสินค้า')}
					</a><button
						onclick={() =>
							apply({
								...view,
								languageLocked: true,
								plan: { ...view.plan, locale: lang === 'th' ? 'en' : 'th' }
							})}
					>
						{lang === 'th' ? 'EN' : 'ไทย'}
					</button>
				</div>
			</div>
			<div class="search-row wrap">
				<button
					class="brand"
					onclick={() => {
						tab = 'shop';
						query = '';
						shopHome = true;
					}}
					aria-label={t('DynamicShopper home', 'หน้าแรก DynamicShopper')}
				>
					<Icon name="bag" size={34} /><span>Dynamic<span class="brand-light">Shopper</span></span>
				</button>
				<form
					class="search"
					onsubmit={(event) => {
						event.preventDefault();
						shelf?.scrollIntoView({ block: 'start' });
					}}
				>
					<input
						aria-label={t('Search all products', 'ค้นหาสินค้าทั้งหมด')}
						bind:value={query}
						oninput={() => (view.page = 1)}
						placeholder={t('Search all products', 'ค้นหาสินค้าทั้งหมด')}
					/>
					<span class="search-scope">{t('All product groups', 'ทุกกลุ่มสินค้า')}</span>
					<button aria-label={t('Search', 'ค้นหา')}><Icon name="search" /></button>
				</form>
				<button
					class="header-icon"
					aria-label={t('Saved products', 'สินค้าที่บันทึก')}
					onclick={() => (tab = tab === 'saved' ? 'shop' : 'saved')}
				>
					<Icon name="save" size={27} />
				</button>
				<button
					class="header-icon"
					aria-label={t('Open assistant', 'เปิดผู้ช่วย')}
					onclick={() => (sheet = 'assistant')}
				>
					<Icon name="chat" size={27} />
				</button>
			</div>
			<div class="search-hints wrap">
				{#each catalog.categories.slice(0, 5) as category (category.id)}<button
						onclick={() => setCategory(category.id)}
					>
						{category.name[lang]}
					</button>{/each}
			</div>
		</header>
		<main class="wrap shop-main">
			<div class="breadcrumb">
				{t('Home', 'หน้าแรก')}<span>/</span>{t('Shopee product catalog', 'รายการสินค้าจาก Shopee')}
			</div>
			<section class="shop-banner" aria-label={t('Shop information', 'ข้อมูลร้านค้า')}>
				<div class="shop-identity">
					<div class="shop-avatar"><Icon name="bag" size={31} /></div>
					<div>
						<h1>{t('Discover your next find', 'เลือกของที่ใช่ในแบบของคุณ')}</h1>
						<p>
							{t('Products from multiple groups and sellers', 'สินค้าหลากกลุ่มจากหลายร้านค้า')}
						</p>
					</div>
				</div>
				<dl class="shop-facts">
					<div>
						<dt>{t('Products', 'สินค้า')}</dt>
						<dd data-catalog-total={catalog.items.length}>
							{new Intl.NumberFormat(lang).format(catalog.items.length)}
						</dd>
					</div>
					<div>
						<dt>{t('Catalog', 'ข้อมูลสินค้า')}</dt>
						<dd role="status">{catalogMessage}</dd>
					</div>
					<div>
						<dt>{t('Source observation', 'วันที่บันทึกจากต้นทาง')}</dt>
						<dd>
							{#if catalog.snapshot.observedAt}<time datetime={catalog.snapshot.observedAt}>
									{catalog.snapshot.observedAt.slice(0, 10)}
								</time>{:else}{t('Not recorded', 'ไม่ได้ระบุ')}{/if}
						</dd>
					</div>
					<div>
						<dt>{t('Current terms', 'เงื่อนไขปัจจุบัน')}</dt>
						<dd>{t('Confirm at source', 'ตรวจสอบที่ต้นทาง')}</dd>
					</div>
				</dl>
				<div class="shop-actions">
					<a href={catalog.snapshot.source} target="_blank" rel="noreferrer">
						{t('View catalog source', 'ดูแหล่งข้อมูลสินค้า')}
					</a><button onclick={() => (sheet = 'assistant')}>
						<Icon name="chat" size={18} />{t('Shopping assistant', 'ผู้ช่วยเลือกซื้อ')}
					</button>
				</div>
			</section>
			<p class="catalog-status" role="status">
				<span>
					{new Intl.NumberFormat(lang).format(catalog.items.length)}
					{t('products', 'สินค้า')}
				</span>
				<span>{catalogMessage}</span>
				{#if catalog.snapshot.observedAt}<time datetime={catalog.snapshot.observedAt}>
						{catalog.snapshot.observedAt.slice(0, 10)}
					</time>{/if}
			</p>
			<nav class="store-tabs" aria-label={t('Shop navigation', 'เมนูร้านค้า')}>
				<button
					class:active={shopHome && tab === 'shop'}
					onclick={() => {
						tab = 'shop';
						shopHome = true;
					}}
				>
					{t('Discover', 'ค้นพบสินค้า')}
				</button>
				<button
					class:active={tab === 'shop' && !shopHome && view.category === 'all'}
					onclick={() => setCategory('all')}
				>
					{t('All products', 'สินค้าทั้งหมด')}
				</button>
				{#each catalog.categories.slice(0, 4) as category (category.id)}<button
						class:active={!shopHome && tab === 'shop' && view.category === category.id}
						onclick={() => setCategory(category.id)}
					>
						{category.name[lang]}
					</button>{/each}
				<button class:active={tab === 'saved'} onclick={() => (tab = 'saved')}>
					{t('Saved products', 'สินค้าที่บันทึก')}
				</button>
			</nav>
			{#if shopHome && tab === 'shop' && !query}
				<section
					class="department-shelves"
					aria-label={t('Browse product groups', 'เลือกตามกลุ่มสินค้า')}
				>
					{#each catalog.categories.slice(0, 8) as category (category.id)}
						{@const photo = catalog.items.find(
							(product) => product.category === category.id && product.image
						)?.image}
						<button onclick={() => setCategory(category.id)}>
							<span>
								<small>{t('PRODUCT GROUPS', 'เลือกตามกลุ่มสินค้า')}</small><strong>
									{category.name[lang]}
								</strong><span>
									{t('View products', 'ดูสินค้าในกลุ่มนี้')}
									<Icon name="arrow" size={18} />
								</span>
							</span>
							{#if photo}<img src={photo} alt="" loading="lazy" />{/if}
						</button>
					{/each}
				</section>
			{/if}
			<div class="personalize-strip">
				<div>
					<Icon name="spark" /><strong>
						{view.interview
							? t('Your answers. Your view.', 'หน้าร้านตามคำตอบของคุณ')
							: t('Make this shop your own', 'ปรับร้านให้เข้ากับคุณ')}
					</strong>
				</div>
				<button onclick={() => (sheet = 'interview')}>
					{t('Personalize with a quick interview', 'ตอบสั้น ๆ เพื่อปรับมุมมอง')}
				</button>
			</div>
			<div class="view-result">
				{#if view.interview}
					<section
						class="interview-receipt"
						bind:this={interviewReceipt}
						tabindex="-1"
						aria-label={t('What changed', 'สิ่งที่เปลี่ยน')}
					>
						<div class="receipt-top">
							<h3>{t('What changed', 'สิ่งที่เปลี่ยน')}</h3>
							<span>{t('Product facts stay the same', 'ข้อมูลสินค้าคงเดิม')}</span>
						</div>
						<div class="preference-chips">
							{#each interviewChanges as item (item.field)}<button
									aria-label={`${t('Remove', 'ลบ')} ${item.text}`}
									onclick={() =>
										apply(removeInterviewPreference($state.snapshot(view), item.field))}
								>
									<span>{item.text}</span><Icon name="close" size={14} />
								</button>{/each}
						</div>
						{#if !interviewChanges.length}<p>
								{t('Your current view already matches these answers.', 'มุมมองปัจจุบันตรงกับคำตอบนี้แล้ว')}
							</p>{/if}
						<details class="inference-note">
							<summary>
								{t('How the interview adapted this shop', 'interview ปรับร้านนี้อย่างไร')}
							</summary>
							<p data-testid="interview-backend">
								{view.interview.backend === 'cnn'
									? t(
											'CNN evaluated your answers on this device. Its presentation proposal passed validation before the shop changed.',
											'CNN ประเมินคำตอบบนอุปกรณ์นี้ และตรวจสอบข้อเสนอการแสดงผลก่อนปรับหน้าร้าน'
										)
									: view.interview.backend === 'incomplete'
										? t(
												'Skipped questions keep their settings. The answered preferences used the direct fallback.',
												'ข้อที่ข้ามคงการตั้งค่าเดิม ใช้คำตอบที่มีผ่านกฎสำรอง'
											)
										: t(
												'CNN was unavailable. Your answers still adapted the shop using the direct fallback.',
												'CNN ใช้งานไม่ได้ จึงปรับร้านตามคำตอบผ่านกฎสำรอง'
											)}
							</p>
							<p>
								{t(
									'The CNN learned from example rules, not measured shopper outcomes. Product facts stay unchanged.',
									'CNN เรียนรู้จากกฎตัวอย่าง ไม่ใช่ผลการใช้งานของผู้ซื้อจริง ข้อมูลสินค้าคงเดิม'
								)}
							</p>
						</details>
						<div class="receipt-actions">
							<button onclick={() => (sheet = 'interview')}>
								{t('Edit answers', 'แก้คำตอบ')}
							</button><button onclick={undo} disabled={!history.length}>
								{t('Undo', 'ย้อนกลับ')}
							</button><button onclick={() => apply(resetView(view))}>
								{t('Reset view', 'คืนมุมมองเริ่มต้น')}
							</button><button class="chat-next" onclick={() => (sheet = 'assistant')}>
								<Icon name="chat" size={18} />{t('Chat to refine', 'แชตปรับต่อ')}
							</button>
						</div>
					</section>
				{:else if changed}
					<div class="change" role="status">
						<span>{t('View updated · facts unchanged', 'ปรับมุมมองแล้ว · ข้อมูลไม่เปลี่ยน')}</span>
						<div>
							<button onclick={undo}>{t('Undo', 'ย้อนกลับ')}</button><button
								onclick={() => apply(resetView(view))}
							>
								{t('Reset view', 'คืนมุมมองเริ่มต้น')}
							</button>
						</div>
					</div>
				{/if}
			</div>
			<div class="shop-content">
				<aside class="filter-sidebar">
					<h2><Icon name="filter" size={18} />{t('Search filters', 'ตัวกรองสินค้า')}</h2>
					<h3>{t('Product groups', 'กลุ่มสินค้า')}</h3>
					<select
						class="group-select"
						aria-label={t('All product groups', 'กลุ่มสินค้าทั้งหมด')}
						value={view.category}
						onchange={(event) => setCategory(event.currentTarget.value)}
					>
						{#each categories as category (category.id)}<option value={category.id}>
								{category.name[lang]}
							</option>{/each}
					</select>
					{#each categories.slice(0, 8) as category (category.id)}<button
							class:active={view.category === category.id}
							onclick={() => setCategory(category.id)}
						>
							<Icon name="grid" size={18} />{category.name[lang]}
						</button>{/each}
					<form
						class="budget"
						onsubmit={(e) => {
							e.preventDefault();
							applyBudget();
						}}
					>
						<label for="budget">{t('Maximum price', 'ราคาสูงสุด')}</label><input
							id="budget"
							type="number"
							min="1"
							step="1"
							bind:value={budget}
							placeholder={t('Baht', 'บาท')}
						/><button class="primary">{t('Apply filter', 'ใช้ตัวกรอง')}</button>
					</form>
					<div class="sidebar-help">
						<Icon name="spark" /><strong>{t('Need a different view?', 'อยากดูสินค้าอีกแบบ?')}</strong>
						<p>{t('Choose the details that matter to you.', 'เลือกรูปแบบและข้อมูลที่คุณอยากเห็น')}</p>
						<button onclick={() => (sheet = 'interview')}>{t('Adjust', 'ปรับมุมมอง')}</button>
					</div>
				</aside>
				<section class="shelf-area" aria-label={t('Product shelf', 'รายการสินค้า')}>
					<div class="heading" id="shop-products" bind:this={shelf} tabindex="-1">
						<h2>
							{tab === 'saved'
								? t('Saved for later', 'สินค้าที่บันทึก')
								: view.interview
									? t('Your shopping view', 'เลือกซื้อในมุมมองของคุณ')
									: t('All products', 'สินค้าทั้งหมด')}
						</h2>
						<button class="mobile-adjust" onclick={() => (sheet = 'interview')}>
							{t('Adjust', 'ปรับมุมมอง')}
						</button>
					</div>
					<div class="sort-bar">
						<div class="catalog-sort">
							<span>{t('Sort by', 'เรียงโดย')}</span>
							<button
								aria-pressed={view.order === 'catalog'}
								onclick={() =>
									apply({ ...view, order: 'catalog', plan: { ...view.plan, priorities: {} } })}
							>
								{t('Default order', 'ลำดับเริ่มต้น')}
							</button>
						</div>
						<div class="category-pills mobile-categories">
							<label>
								{t('Product group', 'กลุ่มสินค้า')}<select
									aria-label={t('Product group', 'กลุ่มสินค้า')}
									value={view.category}
									onchange={(event) => setCategory(event.currentTarget.value)}
								>
									{#each categories as category (category.id)}<option value={category.id}>
											{category.name[lang]}
										</option>{/each}
								</select>
							</label>
						</div>
						<label class="sort-label">
							<span>{t('Price', 'ราคา')}</span><select
								aria-label={t('Sort products', 'เรียงสินค้า')}
								value={view.order}
								onchange={(e) => apply({ ...view, order: e.currentTarget.value as View['order'] })}
							>
								<option value="catalog">{t('Default', 'ค่าเริ่มต้น')}</option><option value="price-low">
									{t('Price: low to high', 'ราคา: ต่ำไปสูง')}
								</option><option value="price-high">
									{t('Price: high to low', 'ราคา: สูงไปต่ำ')}
								</option>
							</select>
						</label><button
							class="mobile-filter"
							aria-label={t('Filter products', 'กรองสินค้า')}
							onclick={() => (sheet = 'filters')}
						>
							<Icon name="filter" />
						</button>
					</div>
					{#if view.plan.maxPrice !== null}<div class="change">
							<span>
								{t('Maximum price', 'ราคาสูงสุด')}: {formatBaht(view.plan.maxPrice, lang)}
							</span><button
								onclick={() => {
									budget = undefined;
									apply({ ...view, plan: { ...view.plan, maxPrice: null } });
								}}
							>
								{t('Clear filter', 'ล้างตัวกรอง')}
							</button>
						</div>{/if}
					{#if rows.length}<ShopShelf
							plan={view.plan}
							categories={catalog.categories}
							bind:page={view.page}
							{rows}
							{saved}
							onopen={open}
							onsave={(id: string) =>
								(saved = saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id])}
						/>{:else}<div class="empty">
							<Icon name="search" size={38} />
							<h3>{t('No matching products', 'ยังไม่มีสินค้าที่ตรงกัน')}</h3>
							<p>{t('Try another search or clear the filters.', 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง')}</p>
							<button
								onclick={() => {
									query = '';
									tab = 'shop';
									apply({ ...view, category: 'all', plan: { ...view.plan, maxPrice: null } });
								}}
							>
								{t('Clear search and filters', 'ล้างคำค้นหาและตัวกรอง')}
							</button>
						</div>{/if}
					{#if view.interview && (view.interview.applied.priorities || view.plan.details.includes('reviews'))}<div
							class="availability"
						>
							{#if view.plan.details.includes('reviews')}<p>
									{t(
										'Verified buyer reviews are not available in this snapshot.',
										'ยังไม่มีรีวิวผู้ซื้อที่ยืนยันได้ในข้อมูลชุดนี้'
									)}
								</p>{/if}
							<p>
								{t(
									'Your priority is saved. Only available source information is shown.',
									'บันทึกสิ่งที่คุณให้ความสำคัญแล้ว แสดงเฉพาะข้อมูลที่มีจากต้นทาง'
								)}
							</p>
						</div>{/if}
				</section>
			</div>
			<footer class="source-note">
				<div class="footer-links">
					<div>
						<strong>{t('Shop', 'เลือกซื้อ')}</strong><button
							onclick={() => {
								setCategory('all');
								shelf?.scrollIntoView({ block: 'start' });
							}}
						>
							{t('All products', 'สินค้าทั้งหมด')}
						</button><a href={catalog.snapshot.source} target="_blank" rel="noreferrer">
							{t('Catalog source', 'แหล่งข้อมูลสินค้า')}
						</a>
					</div>
					<div>
						<strong>{t('Your view', 'มุมมองของคุณ')}</strong><button
							onclick={() => (sheet = 'interview')}
						>
							{t('Reading preferences', 'การอ่านและการแสดงผล')}
						</button><button onclick={() => showComparison(true)}>
							{t('Compare example views', 'ลองเทียบมุมมอง')}
						</button>
					</div>
					<div>
						<strong>{t('Design workspace', 'พื้นที่ออกแบบ')}</strong><button
							onclick={() => showLibrary(true)}
						>
							{t('Explore UI parts', 'คลังชิ้นส่วน UI')}
						</button><a href="https://help.shopee.co.th/th/s" target="_blank" rel="noreferrer">
							{t('Shopee help center', 'ศูนย์ช่วยเหลือ Shopee')}
						</a>
					</div>
				</div>
				<span>DynamicShopper · {t('Independent shopping prototype', 'ต้นแบบการเลือกซื้ออิสระ')}</span>
				<p>
					{t('Shopee listing snapshot', 'ข้อมูลรายการจาก Shopee')} ·
					{#if catalog.snapshot.observedAt}<time datetime={catalog.snapshot.observedAt}>
							{catalog.snapshot.observedAt.slice(0, 10)}
						</time>{:else}{t('Observation date unavailable', 'ยังไม่มีวันที่บันทึกจากต้นทาง')}{/if}
					· {t(
						'Check the listing for current price and shipping.',
						'ตรวจสอบราคาปัจจุบันและค่าจัดส่งที่รายการต้นทาง'
					)}
				</p>
			</footer>
		</main>
		<button class="chat-launch" onclick={() => (sheet = 'assistant')}>
			<Icon name="chat" />{t('Chat to refine', 'แชตปรับต่อ')}
		</button>
		<nav class="bottom" aria-label={t('Main navigation', 'เมนูหลัก')}>
			{#each [['shop', 'Shop', 'ร้านค้า', 'home'], ['saved', 'Saved', 'บันทึก', 'save'], ['interview', 'For you', 'สำหรับคุณ', 'spark'], ['assistant', 'Assistant', 'ผู้ช่วย', 'chat']] as n (n[0])}<button
					aria-pressed={tab === n[0] || (n[0] === 'assistant' && sheet === 'assistant')}
					onclick={() => {
						if (n[0] === 'assistant') sheet = 'assistant';
						else if (n[0] === 'interview') sheet = 'interview';
						else tab = n[0];
					}}
				>
					<Icon name={n[3]} /><span>{n[lang === 'th' ? 2 : 1]}</span>
				</button>{/each}
		</nav>
		{#if sheet === 'filters'}<Sheet
				title={t('Filter products', 'กรองสินค้า')}
				onclose={() => (sheet = null)}
			>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						applyBudget();
					}}
				>
					<label for="mobile-budget">{t('Maximum price', 'ราคาสูงสุด')}</label><input
						id="mobile-budget"
						type="number"
						min="1"
						step="1"
						bind:value={budget}
						placeholder={t('Baht', 'บาท')}
					/><button class="primary">{t('Apply filter', 'ใช้ตัวกรอง')}</button>
				</form>
			</Sheet>{/if}
		{#if sheet === 'interview'}<Sheet
				title={t('Make the shop fit you', 'ปรับร้านให้เหมาะกับคุณ')}
				onclose={() => (sheet = null)}
			>
				<Interview {view} oncomplete={finishInterview} />
			</Sheet>{/if}
		{#if sheet === 'assistant'}<Sheet
				title={t('Your shopping companion', 'ผู้ช่วยเลือกซื้อ')}
				onclose={() => (sheet = null)}
			>
				<span class="overline">{t('WORKS OFFLINE', 'ใช้งานออฟไลน์ได้')}</span>
				<h3>{t('What matters today?', 'วันนี้อยากเลือกแบบไหน?')}</h3>
				<p>
					{t(
						'Tell me how you want to browse. Your product information stays the same.',
						'บอกวิธีที่คุณอยากเลือกซื้อ ข้อมูลสินค้าจะคงเดิม'
					)}
				</p>
				<div class="options">
					{#each [['Compare products', 'เปรียบเทียบสินค้า'], ['Large text', 'ตัวอักษรใหญ่'], ['Budget under 500 baht', 'งบไม่เกิน 500 บาท']] as s (s[0])}<button
							onclick={() => {
								message = s[lang === 'th' ? 1 : 0];
								send();
							}}
						>
							{s[lang === 'th' ? 1 : 0]}
						</button>{/each}
				</div>
				<div class="conversation" aria-live="polite">
					{#each chat as entry, index (index)}
						<p class:user={entry.role === 'user'}>{entry.text}</p>
					{/each}
				</div>
				{#if outcome === 'ask'}<div class="options">
						{#each rows.slice(0, 24) as p (p.id)}<button onclick={() => open(p)}>
								{p.name[lang]}
							</button>{/each}
					</div>{/if}
				<button class="show-shop" onclick={() => (sheet = null)}>
					{t('See my updated shop', 'ดูหน้าร้านที่ปรับแล้ว')}
				</button>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						send();
					}}
				>
					<label for="message">{t('Your request', 'ความต้องการของคุณ')}</label><textarea
						id="message"
						bind:value={message}
						maxlength="1000"
						placeholder={t('Help me compare…', 'ช่วยเปรียบเทียบให้หน่อย…')}></textarea><button
						class="primary"
						disabled={!message.trim()}
					>
						{t('Send request', 'ส่งคำขอ')}
					</button>
				</form>
				<button disabled={!history.length} onclick={undo}>
					{t('Undo last view change', 'ย้อนการปรับมุมมองล่าสุด')}
				</button>
			</Sheet>{/if}
		{#if sheet === 'product'}<Sheet
				title={t('Product details', 'รายละเอียดสินค้า')}
				onclose={() => (sheet = null)}
			>
				{#if focus.image}<img
						class="detail-photo"
						src={focus.image}
						alt={focus.name[lang]}
					/>{/if}<span class="overline">
					{focus.sellerName ?? t('Seller not recorded', 'ไม่ได้บันทึกชื่อร้านค้า')}
				</span>
				<h2>{focus.name[lang]}</h2>
				{#if focus.size}<p data-fact-key={`${focus.id}:size`} data-raw={focus.size[lang]}>
						{focus.size[lang]}
					</p>{/if}
				<div class="receipt">
					<span>
						{focus.sourceLabel?.[lang] ?? t('SAVED LISTING PRICE', 'ราคาจากรายการที่บันทึกไว้')}
					</span>{#if focus.price !== null}<strong
							data-fact-key={`${focus.id}:shopPrice`}
							data-raw={focus.price}
						>
							{formatBaht(focus.price, lang)}
						</strong>{:else}<p>{t('Price unavailable', 'ยังไม่มีราคาที่ตรวจสอบได้')}</p>{/if}
					<p>
						{t(
							'Shipping, stock and checkout eligibility are not confirmed.',
							'ยังไม่ยืนยันค่าจัดส่ง สต็อก และสิทธิ์ตอนชำระเงิน'
						)}
					</p>
				</div>
				<div class="options">
					<button onclick={() => (outcome = 'ask')}>
						{t('Where is this from?', 'ข้อมูลมาจากไหน?')}
					</button><button onclick={() => (outcome = 'deal')}>
						{t('Check deal', 'ตรวจสอบดีล')}
					</button>
				</div>
				{#if outcome === 'ask'}<div class="answer">
						{t(
							'Name, size and price come from the linked source observations. Check the current listing for the selected variant.',
							'ชื่อ ขนาด และราคามาจากข้อมูลต้นทางที่บันทึกไว้ ตรวจสอบตัวเลือกปัจจุบันจากรายการสินค้า'
						)}<a href={focus.priceSource ?? focus.source} target="_blank" rel="noreferrer">
							{t('Price source', 'แหล่งที่มาของราคา')} ↗
						</a>
					</div>{/if}{#if outcome === 'deal'}<div class="answer">
						<h3>{t('Confirm eligibility first', 'ตรวจสอบสิทธิ์ก่อน')}</h3>

						<p>
							{t(
								'No final total: shipping and voucher stacking terms are unavailable.',
								'ยังไม่มียอดสุทธิ เนื่องจากไม่มีข้อมูลค่าจัดส่งและเงื่อนไขใช้โค้ดร่วมกัน'
							)}
						</p>
					</div>{/if}<a
					class="primary external"
					href={focus.source}
					target="_blank"
					rel="noreferrer"
				>
					{t('Open listing on Shopee', 'เปิดรายการบน Shopee')} ↗
				</a>
			</Sheet>{/if}
	</div>
{/if}
