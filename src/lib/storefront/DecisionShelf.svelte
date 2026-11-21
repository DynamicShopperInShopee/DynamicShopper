<script lang="ts">
	import { getProduct, specs, type Locale } from '../catalog';
	import ProductShelf from './ProductShelf.svelte';
	import AddToCart from './AddToCart.svelte';
	import Fact from './Fact.svelte';
	import { resolveCatalogFact } from './catalogFact';
	import { getStoreSession } from './store.svelte';
	let {
		ids,
		locale,
		mode,
		listingHref
	}: { ids: string[]; locale: Locale; mode: string; listingHref: (id: string) => string } =
		$props();
	const session = getStoreSession();
	const selected = $derived(
		mode === 'easy'
			? ids
					.filter((id) => getProduct(id)?.tags.includes('simple'))
					.sort(
						(a, b) =>
							Number(getProduct(a)?.specs.programs) - Number(getProduct(b)?.specs.programs) ||
							a.localeCompare(b)
					)
					.slice(0, 3)
			: ids
	);
	const columns = specs['rice-cooker']
		.filter((x) => ['capacity', 'programs', 'warranty'].includes(x.key))
		.map((x) => ({ field: `spec.${x.key}`, label: x.label }));
</script>

<section aria-label={locale === 'th' ? 'ช่วยตัดสินใจ' : 'Decision help'}>
	<p role="status">
		{locale === 'th'
			? mode === 'easy'
				? 'คัดรุ่นที่แค็ตตาล็อกระบุว่าใช้ง่าย เรียงตามจำนวนโปรแกรมจากน้อยไปมาก ภายใต้งบและตัวกรองของคุณ'
				: 'เทียบสเปกภายใต้งบและตัวกรองของคุณ'
			: mode === 'easy'
				? 'Catalog-tagged simple models, fewer programs first, within your budget and filters.'
				: 'Compare specifications within your budget and filters.'}
	</p>
	<ProductShelf
		productIds={selected}
		layout={mode === 'compare' ? 'table' : 'grid'}
		{locale}
		{columns}
		{listingHref}
		details={['price', 'specs', 'summary']}
	>
		{#snippet extras(id: string)}
			{#if mode === 'easy'}<p>
					{locale === 'th' ? 'ข้อมูลประกอบการเลือก' : 'Selection evidence'}: <Fact
						fact={resolveCatalogFact(id, 'summary', locale)!}
					/>
				</p>{/if}
			<AddToCart productId={id} {locale} onAdd={session.addProduct} />
		{/snippet}
	</ProductShelf>
</section>
