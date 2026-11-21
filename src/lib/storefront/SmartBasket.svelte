<script lang="ts">
	import { formatBaht, type Locale } from '../catalog';
	import { companion } from '../pricing/companion';
	import { getStoreSession } from './store.svelte';
	import Fact from './Fact.svelte';
	import { resolveCatalogFact } from './catalogFact';
	import AddToCart from './AddToCart.svelte';
	let { locale }: { locale: Locale } = $props();
	const session = getStoreSession();
	let dismissed = $state(false);
	const offer = $derived(dismissed ? undefined : companion(session.cart, session.clock.context));
</script>

{#if offer}
	<section aria-label="Smart Basket" class="basket">
		<h2>Smart Basket</h2>
		<p>
			{locale === 'th'
				? 'ของใช้ต่อเนื่องในกิจวัตร ดูสภาพผิวที่ระบุไว้ก่อนเลือก'
				: 'A companion for your routine. Check the listed skin type before choosing.'}
		</p>
		<Fact fact={resolveCatalogFact(offer.productId, 'name', locale)!} />
		<p><Fact fact={resolveCatalogFact(offer.productId, 'spec.skinType', locale)!} /></p>
		<p>
			{locale === 'th' ? 'รีวิวเซรั่มในแค็ตตาล็อก' : 'Catalog serum review'}: <Fact
				fact={resolveCatalogFact(offer.sourceId, 'review.0', locale)!}
			/>
		</p>
		<p>
			{locale === 'th' ? 'จ่ายเพิ่มสุทธิ' : 'Net additional cost'}:
			<strong data-source="pricing" data-field="extraCost" data-raw={offer.extraCost}>
				{formatBaht(offer.extraCost, locale)}
			</strong>
		</p>
		<p>
			{locale === 'th' ? 'ยอดสุทธิใหม่' : 'New basket total'}:
			<strong data-source="pricing" data-field="total" data-raw={offer.total}>
				{formatBaht(offer.total, locale)}
			</strong>
		</p>
		<AddToCart productId={offer.productId} {locale} onAdd={session.addProduct} />
		<button onclick={() => (dismissed = true)}>{locale === 'th' ? 'ไม่เอา' : 'No thanks'}</button>
	</section>
{/if}

<style>
	.basket {
		border: 1px solid var(--ink);
		padding: 1rem;
		margin-block: 1rem;
		overflow-wrap: anywhere;
	}
	button {
		font: inherit;
		min-height: 48px;
		padding: 0.5rem 1rem;
		background: var(--surface);
		color: var(--ink);
		border: 1px solid currentColor;
	}
</style>
