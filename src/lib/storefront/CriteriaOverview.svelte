<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import {
		categories,
		formatBaht,
		formatFact,
		products,
		resolveFact,
		shops,
		specs,
		type Category,
		type Fact,
		type ShopId,
		type SpecKey
	} from '../catalog';
	import { densities, layouts, priorities, type ShopperPlan } from '../personalization/plan';
	import { matchesQuery } from '../personalization/ranking';
	import { rankingTerms, storefrontCopy } from './copy';
	import FactValue from './FactValue.svelte';
	import { rawAttribute } from './verify';

	let {
		plan,
		factRoot = $bindable(),
		onChange,
		freeShipping = false,
		capacity,
		onShipping,
		onCapacity
	}: {
		plan: ShopperPlan;
		factRoot?: HTMLElement;
		onChange: (patch: Partial<ShopperPlan>) => void;
		freeShipping?: boolean;
		capacity?: number;
		onShipping?: (active: boolean) => void;
		onCapacity?: (volume: number | undefined) => void;
	} = $props();

	const th = $derived(plan.locale === 'th');
	const store = $derived(storefrontCopy[plan.locale]);
	const layoutNames = {
		grid: ['Grid', 'ตารางการ์ด'],
		list: ['List', 'รายการ'],
		table: ['Comparison table', 'ตารางเปรียบเทียบ']
	};
	const spacingNames = {
		compact: ['Compact', 'กระชับ'],
		comfortable: ['Comfortable', 'ปกติ'],
		spacious: ['Spacious', 'โปร่ง']
	};
	const viewNames = $derived([
		plan.locale === 'th' ? 'ไทย' : 'English',
		store[plan.theme === 'large-print' ? 'large' : plan.theme],
		layoutNames[plan.layout][th ? 1 : 0],
		...(plan.density === 'comfortable' ? [] : [spacingNames[plan.density][th ? 1 : 0]]),
		...(plan.simplified ? [th ? 'รายการคัดสรร' : 'Shortlist'] : [])
	]);
	const typedCategories = Object.keys(categories) as Category[];
	const focusCategory = $derived.by(() => {
		if (plan.category) return plan.category;
		const matched = products.filter((product) => matchesQuery(product, plan.query));
		const first = matched[0]?.category;
		return first && matched.every((product) => product.category === first) ? first : null;
	});
	const definitions = $derived(
		focusCategory ? specs[focusCategory].filter((spec) => spec.direction) : []
	);
	const allDefinitions = Object.values(specs).flat();
	const cookerVolumes = new SvelteMap<number, Fact>();
	for (const product of products) {
		if (product.category !== 'rice-cooker') continue;
		const fact = resolveFact(product.id, 'spec.capacity');
		if (fact && typeof fact.raw === 'number') cookerVolumes.set(fact.raw, fact);
	}
	const capOptions = [...cookerVolumes].sort(([a], [b]) => a - b);
	const selectedCap = $derived(capOptions.find(([volume]) => volume === capacity));
	const requirements = $derived([
		...(plan.query ? [plan.query] : []),
		...(plan.category ? [categories[plan.category][plan.locale]] : []),
		...shops.filter((shop) => plan.shops.includes(shop.id)).map((shop) => shop.name[plan.locale]),
		...(plan.mallOnly ? [th ? 'เฉพาะร้าน Mall' : 'Mall shops only'] : []),
		...(freeShipping ? [store.freeOnly] : [])
	]);
	const activePriorities = $derived(priorities.filter((key) => (plan.priorities[key] ?? 0) > 0));
	const activeSpecs = $derived(
		(Object.keys(plan.specPreferences) as SpecKey[]).flatMap((key) => {
			const spec = (focusCategory ? specs[focusCategory] : allDefinitions).find(
				(item) => item.key === key && item.direction
			);
			return spec && plan.specPreferences[key] ? [spec] : [];
		})
	);
	const stronger = $derived(th ? 'สำคัญมาก' : 'High priority');
	const secondary = $derived(th ? 'สำคัญรองลงมา' : 'Secondary priority');
	const higher = $derived(th ? 'เน้นค่าสูง' : 'Prefer higher');
	const lower = $derived(th ? 'เน้นค่าต่ำ' : 'Prefer lower');
	const remove = $derived(th ? 'นำออก' : 'Remove');
	const preferenceSummary = $derived([
		...activePriorities.map((key) => rankingTerms[key][th ? 1 : 0]),
		...activeSpecs.map(
			(spec) =>
				spec.label[plan.locale] +
				' · ' +
				(plan.specPreferences[spec.key] === 'higher' ? higher : lower)
		)
	]);
	let addPreference: HTMLSelectElement;

	function setPriority(key: (typeof priorities)[number], value: string) {
		const next = { ...plan.priorities };
		if (value === 'high') next[key] = 1;
		else if (value === 'secondary') next[key] = 0.5;
		else if (value === '') delete next[key];
		else return;
		onChange({ priorities: next });
		if (!value) void tick().then(() => addPreference?.focus());
	}
	function setSpec(key: SpecKey, direction: string) {
		const next = { ...plan.specPreferences };
		if (direction === 'higher' || direction === 'lower') next[key] = direction;
		else if (!direction) delete next[key];
		else return;
		onChange({ specPreferences: next });
		if (!direction) void tick().then(() => addPreference?.focus());
	}
	function addChoice(event: Event & { currentTarget: HTMLSelectElement }) {
		const value = event.currentTarget.value;
		event.currentTarget.value = '';
		const priority = priorities.find((key) => key === value);
		if (priority) setPriority(priority, 'high');
		else {
			const spec = definitions.find((item) => item.key === value);
			if (spec?.direction) setSpec(spec.key, spec.direction);
		}
	}
	function changeShop(id: ShopId, selected: boolean) {
		onChange({ shops: selected ? [...plan.shops, id] : plan.shops.filter((shop) => shop !== id) });
	}
	function submitRequirement(
		event: SubmitEvent & { currentTarget: HTMLFormElement },
		key: 'query' | 'maxPrice'
	) {
		event.preventDefault();
		const value = new FormData(event.currentTarget).get(key);
		if (typeof value !== 'string') return;
		const text = value.trim();
		if (key === 'query') onChange({ query: text });
		else if (!text) onChange({ maxPrice: null });
		else if (Number.isSafeInteger(Number(text)) && Number(text) >= 0)
			onChange({ maxPrice: Number(text) });
	}
</script>

<section bind:this={factRoot} id="criteria-overview" tabindex="-1" aria-labelledby="criteria-title">
	<h2 id="criteria-title">{th ? 'เกณฑ์การเลือกสินค้า' : 'Shopping criteria'}</h2>
	<div class="groups">
		<details>
			<summary>
				<h3>{th ? 'เงื่อนไข' : 'Requirements'}</h3>
				<span>
					{requirements.join(' · ')}
					{#if plan.maxPrice !== null}
						{requirements.length ? ' · ' : ''}{th ? 'ไม่เกิน ' : 'Up to '}
						<span data-preference="maxPrice" data-raw={plan.maxPrice}>
							{formatBaht(plan.maxPrice, plan.locale)}
						</span>
					{/if}
					{#if selectedCap}
						{requirements.length || plan.maxPrice !== null ? ' · ' : ''}
						<FactValue
							productId={selectedCap[1].productId}
							field="spec.capacity"
							locale={plan.locale}
						/>
					{/if}
					{#if !requirements.length && plan.maxPrice === null && !selectedCap}{th
							? 'สินค้าทั้งหมด'
							: 'All products'}{/if}
				</span>
			</summary>
			<div class="controls">
				<label>
					{th ? 'หมวดสินค้า' : 'Product category'}
					<select
						value={plan.category ?? ''}
						onchange={(event) =>
							onChange({
								category: typedCategories.find((key) => key === event.currentTarget.value) ?? null
							})}
					>
						<option value="">{store.all}</option>
						{#each typedCategories as key (key)}<option value={key}>
								{categories[key][plan.locale]}
							</option>{/each}
					</select>
				</label>
				<form onsubmit={(event) => submitRequirement(event, 'query')}>
					<label>
						{th ? 'คำค้น' : 'Search terms'}<input name="query" maxlength="80" value={plan.query} />
					</label>
					<button>{th ? 'ใช้คำค้น' : 'Apply search'}</button>
					{#if plan.query}<button type="button" onclick={() => onChange({ query: '' })}>
							{th ? 'ล้างคำค้น' : 'Clear search'}
						</button>{/if}
				</form>
				<form onsubmit={(event) => submitRequirement(event, 'maxPrice')}>
					<label>
						{th ? 'งบสูงสุด (บาท)' : 'Maximum budget (baht)'}
						<input
							name="maxPrice"
							type="number"
							inputmode="numeric"
							min="0"
							max={Number.MAX_SAFE_INTEGER}
							step="1"
							value={plan.maxPrice ?? ''}
							placeholder={th ? 'ไม่จำกัด' : 'No limit'}
						/>
					</label>
					<button>{th ? 'ใช้งบนี้' : 'Apply budget'}</button>
					{#if plan.maxPrice !== null}<button
							type="button"
							onclick={() => onChange({ maxPrice: null })}
						>
							{th ? 'ยกเลิกงบ' : 'Remove budget'}
						</button>{/if}
				</form>
				{#if onShipping}<label class="check">
						<input
							type="checkbox"
							checked={freeShipping}
							onchange={(event) => onShipping?.(event.currentTarget.checked)}
						/>{th ? 'เลือกเฉพาะสินค้าที่ส่งฟรี' : 'Require free shipping'}
					</label>{/if}
				{#if onCapacity && (focusCategory === 'rice-cooker' || selectedCap)}
					<label>
						{th ? 'ความจุหม้อหุงข้าว' : 'Cooker capacity'}
						<select
							value={capacity ?? ''}
							onchange={(event) =>
								onCapacity?.(
									capOptions.find(([volume]) => String(volume) === event.currentTarget.value)?.[0]
								)}
						>
							<option value="">{store.all}</option>
							{#each capOptions as [volume, fact] (volume)}<option
									value={volume}
									data-fact-node
									data-product-id={fact.productId}
									data-fact={fact.field}
									data-source="catalog"
									data-raw={rawAttribute(fact.raw)}
								>
									{formatFact(fact, plan.locale)}
								</option>{/each}
						</select>
					</label>
				{/if}
				<label class="check">
					<input
						type="checkbox"
						checked={plan.mallOnly}
						onchange={(event) => onChange({ mallOnly: event.currentTarget.checked })}
					/>{th ? 'เฉพาะร้าน Mall' : 'Mall shops only'}
				</label>
				<fieldset>
					<legend>{th ? 'ร้านค้า' : 'Shops'}</legend>
					{#each shops.filter((shop) => !focusCategory || shop.categories.includes(focusCategory) || plan.shops.includes(shop.id)) as shop (shop.id)}
						<label class="check">
							<input
								type="checkbox"
								checked={plan.shops.includes(shop.id)}
								onchange={(event) => changeShop(shop.id, event.currentTarget.checked)}
							/>{shop.name[plan.locale]}
						</label>
					{/each}
				</fieldset>
			</div>
		</details>
		<details>
			<summary>
				<h3>{th ? 'ความต้องการ' : 'Preferences'}</h3>
				<span>
					{preferenceSummary.join(' · ') || (th ? 'ยังไม่ได้เลือก' : 'No preferences selected')}
				</span>
			</summary>
			<div class="controls">
				{#each activePriorities as key (key)}
					<label>
						{rankingTerms[key][th ? 1 : 0]}
						<select
							value={plan.priorities[key] === 1
								? 'high'
								: plan.priorities[key] === 0.5
									? 'secondary'
									: 'current'}
							onchange={(event) => setPriority(key, event.currentTarget.value)}
						>
							{#if plan.priorities[key] !== 1 && plan.priorities[key] !== 0.5}<option
									value="current"
								>
									{th ? 'ระดับปัจจุบัน' : 'Current priority'}
								</option>{/if}
							<option value="high">{stronger}</option><option value="secondary">
								{secondary}
							</option><option value="">{remove}</option>
						</select>
					</label>
				{/each}
				{#each activeSpecs as spec (spec.key)}
					<label>
						{spec.label[plan.locale]}
						<select
							value={plan.specPreferences[spec.key]}
							onchange={(event) => setSpec(spec.key, event.currentTarget.value)}
						>
							<option value="higher">{higher}</option><option value="lower">{lower}</option><option
								value=""
							>
								{remove}
							</option>
						</select>
					</label>
				{/each}
				<label>
					{th ? 'เพิ่มความต้องการ' : 'Add a preference'}
					<select bind:this={addPreference} onchange={addChoice}>
						<option value="">{th ? 'เลือกหัวข้อ' : 'Choose a preference'}</option>
						{#each priorities.filter((key) => !activePriorities.includes(key)) as key (key)}<option
								value={key}
							>
								{rankingTerms[key][th ? 1 : 0]}
							</option>{/each}
						{#each definitions.filter((spec) => !plan.specPreferences[spec.key]) as spec (spec.key)}<option
								value={spec.key}
							>
								{spec.label[plan.locale]}
							</option>{/each}
					</select>
				</label>
			</div>
		</details>
		<details>
			<summary>
				<h3>{th ? 'มุมมอง' : 'View'}</h3>
				<span>{viewNames.join(' · ')}</span>
			</summary>
			<div class="controls">
				<label>
					{th ? 'ภาษาที่แสดง' : 'Display language'}
					<select
						value={plan.locale}
						onchange={(event) =>
							onChange({ locale: event.currentTarget.value === 'th' ? 'th' : 'en' })}
					>
						<option value="en" lang="en">English</option><option value="th" lang="th">ไทย</option>
					</select>
				</label>
				<label>
					{th ? 'การจัดวาง' : 'Layout'}
					<select
						value={plan.layout}
						onchange={(event) => {
							const layout = layouts.find((key) => key === event.currentTarget.value);
							if (layout) onChange({ layout });
						}}
					>
						{#each layouts as layout (layout)}<option value={layout}>
								{layoutNames[layout][th ? 1 : 0]}
							</option>{/each}
					</select>
				</label>
				<label>
					{th ? 'ระยะห่าง' : 'Spacing'}
					<select
						value={plan.density}
						onchange={(event) => {
							const density = densities.find((key) => key === event.currentTarget.value);
							if (density) onChange({ density });
						}}
					>
						{#each densities as density (density)}<option value={density}>
								{spacingNames[density][th ? 1 : 0]}
							</option>{/each}
					</select>
				</label>
				<label class="check">
					<input
						type="checkbox"
						checked={plan.simplified}
						onchange={(event) => onChange({ simplified: event.currentTarget.checked })}
					/>{th ? 'แสดงเฉพาะรายการคัดสรร' : 'Show a shorter list'}
				</label>
			</div>
		</details>
	</div>
</section>

<style>
	section {
		margin-block: 1rem;
		scroll-margin-block-start: 5rem;
		color: var(--ink);
	}
	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.125em;
		line-height: 1.3;
		font-weight: 650;
	}
	.groups {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-items: start;
		border-block: 1px solid var(--seam);
	}
	details {
		min-width: 0;
	}
	details + details {
		border-inline-start: 1px solid var(--seam);
	}
	summary {
		position: relative;
		display: grid;
		align-content: start;
		padding: 0.6rem 1.8rem 0.6rem 0.75rem;
		min-height: var(--tap, 44px);
		gap: 0.2rem;
		cursor: pointer;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary::after {
		content: '';
		position: absolute;
		inset-inline-end: 0.75rem;
		top: 1rem;
		width: 0.45rem;
		height: 0.45rem;
		border-right: 1.5px solid;
		border-bottom: 1.5px solid;
		transform: rotate(45deg);
	}
	details[open] > summary::after {
		transform: rotate(225deg);
	}
	h3 {
		font-size: 1em;
		line-height: 1.35;
		font-weight: 600;
		margin: 0;
	}
	summary span {
		color: var(--muted, #5d5d63);
		line-height: 1.45;
		overflow-wrap: anywhere;
	}
	.controls {
		display: grid;
		padding: 0.25rem 0.75rem 0.8rem;
		gap: 0.55rem;
	}
	label {
		display: grid;
		min-inline-size: 0;
		gap: 0.2rem;
	}
	select,
	input:not([type='checkbox']),
	button {
		min-width: 0;
		width: 100%;
		min-height: var(--tap, 44px);
		font: inherit;
		color: var(--ink);
		background: var(--surface);
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		padding-inline: 0.5rem;
	}
	select {
		text-overflow: ellipsis;
	}
	form {
		display: flex;
		align-items: end;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	form label {
		flex: 1 1 7rem;
	}
	button {
		cursor: pointer;
		width: auto;
	}
	fieldset {
		min-width: 0;
		margin: 0;
		padding: 0.4rem 0 0;
		border: 0;
		border-top: 1px dashed var(--seam);
	}
	.check {
		display: flex;
		align-items: center;
		min-height: var(--tap, 44px);
		gap: 0.5rem;
	}
	.check input {
		flex: 0 0 auto;
		width: 1.1rem;
		height: 1.1rem;
		accent-color: var(--accent);
	}
	:where(summary, button, input, select):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	@media (max-width: 760px) {
		.groups {
			grid-template-columns: 1fr;
		}
		details + details {
			border-inline-start: 0;
			border-top: 1px solid var(--seam);
		}
	}
</style>
