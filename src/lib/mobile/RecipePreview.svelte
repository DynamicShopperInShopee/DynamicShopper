<script lang="ts">
	import { catalogNameAttributes } from './name-attributes';
	/* eslint-disable svelte/no-navigation-without-resolve -- Sourced external listing links. */
	import type { CatalogSnapshot } from '../catalog-api/types';
	import { formatBaht } from '../catalog';
	import Icon from './Icon.svelte';
	import { blockNames, dependencies, type Recipe } from './parts-library';
	let { recipe, lang, catalog }: { recipe: Recipe; lang: 'en' | 'th'; catalog: CatalogSnapshot } =
		$props();
	let query = $state('');
	let category = $state('all');
	let ceiling = $state<number | undefined>();
	let saved = $state<string[]>([]);
	let reading = $state('standard');
	let appliedReading = $state('standard');
	let previousReading = $state<string | null>(null);
	const t = (en: string, th: string) => (lang === 'th' ? th : en);
	const shown = $derived(
		catalog.items
			.filter(
				(p) =>
					(category === 'all' || p.category === category) &&
					`${p.name.en} ${p.name.th}`.toLowerCase().includes(query.trim().toLowerCase()) &&
					(ceiling === undefined || (p.price !== null && p.price <= ceiling))
			)
			.slice(0, 2)
	);
	function applyReading() {
		previousReading = appliedReading;
		appliedReading = reading;
	}
</script>

<div
	class="recipe-preview {recipe.arrangement}"
	class:readable={recipe.id.endsWith('-04') || appliedReading === 'large'}
	data-recipe={recipe.id}
>
	{#each recipe.blocks as block (block)}
		<section class="preview-block block-{block}" class:requires-data={dependencies.has(block)}>
			<div class="block-label">{blockNames[block][lang]}</div>
			{#if block === 'scope'}
				<div class="sample-shop">
					<Icon name="bag" size={28} />
					<div>
						<strong>DynamicShopper</strong><span>
							{t('Products across groups', 'สินค้าหลากกลุ่ม')}
						</span>
					</div>
				</div>
			{:else if block === 'search'}
				<label class="sample-search">
					<Icon name="search" size={20} /><input
						aria-label={t('Search inside this preview', 'ค้นหาในตัวอย่างนี้')}
						bind:value={query}
						placeholder={t('Search this shop', 'ค้นหาในร้านนี้')}
					/>
				</label>
			{:else if block === 'categories'}
				<label class="sample-options">
					{t('Product groups', 'กลุ่มสินค้า')}
					<select aria-label={t('Product groups', 'กลุ่มสินค้า')} bind:value={category}>
						<option value="all">{t('All products', 'สินค้าทั้งหมด')}</option>
						{#each catalog.categories as item (item.id)}<option
								value={item.id}
								{...catalogNameAttributes(item, lang)}
							>
								{item.name[lang]}
							</option>{/each}
					</select>
				</label>
			{:else if block === 'photos'}
				<div class="sample-photos">
					{#each shown as p (p.id)}<figure>
							{#if p.image}<img src={p.image} alt={p.name[lang]} loading="lazy" />{/if}
							<figcaption {...catalogNameAttributes(p, lang)}>{p.name[lang]}</figcaption>
						</figure>{/each}
				</div>
			{:else if block === 'products'}
				<div class="sample-products">
					{#each shown as p (p.id)}<article>
							<h3 {...catalogNameAttributes(p, lang)}>{p.name[lang]}</h3>
							{#if p.size}<p data-fact-key={`${p.id}:size`} data-raw={p.size[lang]}>
									{p.size[lang]}
								</p>{/if}
							<div>
								<a href={p.source} target="_blank" rel="noreferrer">
									{t('View original listing', 'ดูรายการต้นทาง')}<Icon name="arrow" size={16} />
								</a><button
									aria-label={`${t('Save', 'บันทึก')} ${p.name[lang]}`}
									aria-pressed={saved.includes(p.id)}
									onclick={() =>
										(saved = saved.includes(p.id)
											? saved.filter((id) => id !== p.id)
											: [...saved, p.id])}
								>
									<Icon name="save" size={18} />
								</button>
							</div>
						</article>{/each}
				</div>
			{:else if block === 'specs'}
				<dl class="sample-specs">
					{#each shown as p (p.id)}<div>
							<dt {...catalogNameAttributes(p, lang)}>{p.name[lang]}</dt>
							<dd>
								{#if p.size}<span data-fact-key={`${p.id}:size`} data-raw={p.size[lang]}>
										{p.size[lang]}
									</span>{:else}{t('Not provided by source', 'ต้นทางไม่ได้ระบุ')}{/if}
							</dd>
						</div>{/each}
				</dl>
			{:else if block === 'price'}
				<div class="sample-receipt">
					{#each shown as p (p.id)}<div>
							<span {...catalogNameAttributes(p, lang)}>
								{p.name[lang]}
							</span>{#if p.price !== null}<strong
									data-fact-key={`${p.id}:shopPrice`}
									data-raw={p.price}
									data-print={formatBaht(p.price, lang)}
								>
									{formatBaht(p.price, lang)}
								</strong>{:else}<span>{t('Price unavailable', 'ยังไม่มีราคาที่ตรวจสอบได้')}</span>{/if}
							{#if p.sourceLabel}<small
									data-fact-key={`${p.id}:sourceLabel`}
									data-raw={p.sourceLabel[lang]}
								>
									{p.sourceLabel[lang]}
								</small>{/if}
						</div>{/each}<small>
						{t(
							'Saved listing prices. Shipping and checkout total are unconfirmed.',
							'ราคาอ้างอิงที่บันทึกไว้ ยังไม่ยืนยันค่าจัดส่งและยอดชำระ'
						)}
					</small>
				</div>
			{:else if block === 'source'}
				<div class="sample-source">
					<p>
						{t('Original listing observations', 'ข้อมูลที่บันทึกจากรายการต้นทาง')} ·
						{#if catalog.snapshot.observedAt}<time datetime={catalog.snapshot.observedAt}>
								{catalog.snapshot.observedAt.slice(0, 10)}
							</time>{:else}{t('Observation date unavailable', 'ยังไม่มีวันที่บันทึกจากต้นทาง')}{/if}
					</p>
					<a href={catalog.snapshot.source} target="_blank" rel="noreferrer">
						{t('Catalog source', 'แหล่งข้อมูลสินค้า')}
						<Icon name="arrow" size={16} />
					</a><small>
						{t(
							'Current price and selected variant must be checked at the source.',
							'ตรวจสอบราคาปัจจุบันและตัวเลือกสินค้าจากต้นทาง'
						)}
					</small>
				</div>
			{:else if block === 'budget'}
				<label class="sample-budget">
					{t('Maximum listed price', 'ราคาอ้างอิงสูงสุด')}<input
						type="number"
						min="1"
						step="1"
						bind:value={ceiling}
						placeholder={t('Baht', 'บาท')}
					/>
				</label><small>{t('Filters this preview only.', 'กรองเฉพาะตัวอย่างนี้')}</small>
			{:else if block === 'saved'}
				{#if saved.length}<ul>
						{#each catalog.items.filter((p) => saved.includes(p.id)) as p (p.id)}<li
								{...catalogNameAttributes(p, lang)}
							>
								{p.name[lang]}
							</li>{/each}
					</ul>{:else}<div class="sample-empty">
						<Icon name="save" />
						<p>
							{t(
								'Save a product in this preview to build a shortlist.',
								'บันทึกสินค้าจากตัวอย่างนี้เพื่อสร้างรายการที่สนใจ'
							)}
						</p>
					</div>{/if}
			{:else if block === 'preferences'}
				<label class="sample-budget">
					{t('Reading style', 'รูปแบบการอ่าน')}<select bind:value={reading}>
						<option value="standard">{t('Standard', 'มาตรฐาน')}</option><option value="large">
							{t('Large print', 'ตัวอักษรใหญ่')}
						</option>
					</select>
				</label><small>
					{t(
						'Draft choice. Apply in the preview to see it change.',
						'ตัวเลือกฉบับร่าง กดใช้ในตัวอย่างเพื่อดูการเปลี่ยนแปลง'
					)}
				</small>
			{:else if block === 'apply'}
				<button class="preview-primary" onclick={applyReading}>
					{t('Apply within this preview', 'ใช้กับตัวอย่างนี้')}
				</button><small>{t('Your actual shop stays as it was.', 'หน้าร้านจริงยังเป็นมุมมองเดิม')}</small>
			{:else if block === 'undo'}
				<div class="sample-options">
					<button
						disabled={previousReading === null}
						onclick={() => {
							appliedReading = previousReading ?? 'standard';
							previousReading = null;
						}}
					>
						{t('Undo preview change', 'ย้อนการเปลี่ยนในตัวอย่าง')}
					</button><button
						onclick={() => {
							query = '';
							category = 'all';
							ceiling = undefined;
							reading = 'standard';
							appliedReading = 'standard';
							previousReading = null;
							saved = [];
						}}
					>
						{t('Reset preview', 'คืนค่าตัวอย่าง')}
					</button>
				</div>
			{:else if block === 'question'}
				<div class="sample-help">
					<Icon name="chat" />
					<p>{t('What information would help you choose?', 'ข้อมูลแบบไหนช่วยให้คุณเลือกได้ง่ายขึ้น?')}</p>
					<small>
						{t(
							'The shop assistant is available from the storefront. This block previews its placement.',
							'เปิดผู้ช่วยได้จากหน้าร้าน ส่วนนี้แสดงตำแหน่งสำหรับตัวช่วย'
						)}
					</small>
				</div>
			{:else}
				<div class="sample-empty">
					<Icon name={block === 'orders' ? 'bag' : block === 'review' ? 'chat' : 'list'} />
					<p>{t('Awaiting verified service data', 'รอข้อมูลจากระบบที่ตรวจสอบได้')}</p>
					<small>
						{block === 'voucher'
							? t(
									'Eligibility, minimum spend, expiry and stacking rules.',
									'สิทธิ์ ยอดขั้นต่ำ วันหมดอายุ และกฎใช้ร่วมกัน'
								)
							: block === 'shipping'
								? t(
										'Address, chosen variant, carrier and delivery terms.',
										'ที่อยู่ ตัวเลือกสินค้า ผู้ขนส่ง และเงื่อนไขจัดส่ง'
									)
								: block === 'payment'
									? t(
											'Order total and a connected checkout service.',
											'ยอดคำสั่งซื้อและระบบชำระเงินที่เชื่อมต่อแล้ว'
										)
									: block === 'orders'
										? t(
												'An authenticated customer and their real orders.',
												'บัญชีผู้ใช้ที่ยืนยันตัวตนและคำสั่งซื้อจริง'
											)
										: t(
												'Reviews tied to this listing and their original sources.',
												'รีวิวที่ตรงกับรายการนี้และแหล่งต้นฉบับ'
											)}
					</small>
				</div>
			{/if}
			{#if ['products', 'photos', 'specs', 'price'].includes(block) && !shown.length}<p
					class="sample-empty"
				>
					{t(
						'No matching listings. Clear the preview search or price ceiling.',
						'ไม่มีรายการที่ตรงกัน ล้างคำค้นหรือเพดานราคาในตัวอย่าง'
					)}
				</p>{/if}
		</section>
	{/each}
</div>

<style>
	.recipe-preview {
		display: grid;
		gap: 12px;
		min-width: 0;
		padding: 24px;
		background: #f5f5f5;
		align-content: start;
	}
	.preview-block {
		min-width: 0;
		background: white;
		border: 1px solid #e5e5e5;
		padding: 20px;
	}
	.block-label {
		color: #656565;
		font-size: 12px;
		margin-bottom: 14px;
	}
	.recipe-preview :is(button, input, select) {
		font: inherit;
		min-height: 44px;
		border: 1px solid #d8d8d8;
		border-radius: 2px;
		padding: 8px 12px;
		background: white;
		color: #262626;
		min-width: 0;
	}
	.recipe-preview button {
		cursor: pointer;
	}
	.recipe-preview button:disabled {
		color: #777;
		background: #f5f5f5;
		cursor: default;
	}
	.recipe-preview a {
		color: #a73015;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		text-underline-offset: 4px;
		font-size: 13px;
	}
	.recipe-preview :focus-visible {
		outline: 2px solid #b63113;
		outline-offset: 3px;
	}
	.recipe-preview small {
		display: block;
		color: #656565;
		font-size: 12px;
		line-height: 1.7;
	}
	.recipe-preview p {
		margin: 0 0 10px;
	}
	.sample-shop {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.sample-shop strong {
		display: block;
		overflow-wrap: anywhere;
	}
	.sample-shop span {
		color: #656565;
		font-size: 13px;
	}
	.sample-search {
		display: flex;
		align-items: center;
		gap: 10px;
		border: 1px solid #b63113;
		padding: 0 12px;
		background: white;
	}
	.sample-search input {
		flex: 1;
		border: 0;
		padding-left: 0;
		width: 100%;
	}
	.sample-options {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.sample-options button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.sample-options [aria-pressed='true'],
	.recipe-preview .preview-primary {
		background: #b63113;
		color: white;
		border-color: #b63113;
	}
	.sample-photos {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}
	.sample-photos figure {
		margin: 0;
		min-width: 0;
	}
	.sample-photos img {
		width: 100%;
		height: 160px;
		object-fit: contain;
	}
	.sample-photos figcaption {
		margin-top: 8px;
		font-size: 13px;
	}
	.sample-products {
		display: grid;
		gap: 16px;
	}
	.sample-products article + article {
		border-top: 1px solid #e5e5e5;
		padding-top: 16px;
	}
	.sample-products article > div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.sample-products h3 {
		font-size: 16px;
		margin: 0 0 8px;
		font-weight: 600;
	}
	.sample-products p {
		font-size: 13px;
		color: #656565;
	}
	.sample-specs {
		margin: 0;
	}
	.sample-specs > div {
		padding: 12px 0;
		border-bottom: 1px solid #e5e5e5;
	}
	.sample-specs > div:first-child {
		padding-top: 0;
	}
	.sample-specs dt {
		font-weight: 600;
		font-size: 14px;
	}
	.sample-specs dd {
		margin: 8px 0 0;
		font-size: 14px;
	}
	.sample-receipt > div {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		border-bottom: 1px dotted #aaa;
		padding: 12px 0;
	}
	.sample-receipt span {
		font-size: 13px;
	}
	.sample-receipt strong {
		font:
			600 20px 'IBM Plex Mono',
			monospace;
		white-space: nowrap;
	}
	.sample-receipt small {
		margin-top: 14px;
	}
	.sample-source p {
		font-size: 13px;
	}
	.sample-source a {
		overflow-wrap: anywhere;
	}
	.sample-budget {
		display: grid;
		gap: 10px;
		font-size: 14px;
	}
	.sample-budget + small {
		margin-top: 10px;
	}
	.sample-empty {
		padding: 10px 0;
		color: #656565;
	}
	.sample-empty p {
		font-size: 14px;
		color: #262626;
		margin-top: 10px;
	}
	.sample-help > :global(svg) {
		color: #b63113;
	}
	.sample-help p {
		margin-top: 10px;
	}
	.requires-data {
		border-style: dashed;
	}
	.preview-primary + small {
		margin-top: 12px;
	}
	.split,
	.tiles {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.split .preview-block:first-child {
		grid-row: span 2;
	}
	.split .sample-photos {
		grid-template-columns: 1fr;
	}
	.rail {
		gap: 0;
		background: white;
		padding: 12px;
	}
	.rail .preview-block {
		border: 0;
		border-bottom: 1px solid #e5e5e5;
		padding: 16px;
	}
	.rail .sample-products {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.rail .sample-products article + article {
		padding: 0;
		border: 0;
	}
	.receipt {
		padding: 24px;
		background: #fbfbf8;
	}
	.receipt .preview-block {
		border: 0;
		border-bottom: 1px dashed #777;
	}
	.receipt .preview-block:last-child {
		border-bottom: 2px solid #262626;
	}
	.focus {
		gap: 0;
	}
	.focus .preview-block:first-child {
		padding: 28px;
		border-top: 3px solid #b63113;
	}
	.focus .preview-block:not(:first-child) {
		border-top: 0;
	}
	.focus .sample-photos img {
		height: 220px;
	}
	.readable {
		grid-template-columns: 1fr;
	}
	.readable
		:is(
			p,
			span,
			strong,
			small,
			input,
			select,
			button,
			h3,
			a,
			dt,
			dd,
			figcaption,
			label,
			.block-label
		) {
		font-size: 20px !important;
	}
	.readable :is(button, input, select, a) {
		min-height: 48px;
	}
	.readable .sample-receipt > div {
		flex-wrap: wrap;
	}
	@container (max-width: 560px) {
		.recipe-preview {
			padding: 12px;
		}
		.preview-block {
			padding: 16px;
		}
		.split,
		.tiles {
			grid-template-columns: 1fr;
		}
		.split .sample-photos {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.sample-photos img {
			height: 120px;
		}
		.rail .sample-products {
			grid-template-columns: 1fr;
		}
		.sample-receipt > div {
			flex-wrap: wrap;
			gap: 8px;
		}
		.focus .preview-block:first-child {
			padding: 16px;
		}
	}
</style>
