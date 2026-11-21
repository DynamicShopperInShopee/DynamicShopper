<script lang="ts">
	import type { PrintedFact } from './verifyFacts';

	let { fact }: { fact: PrintedFact } = $props();
</script>

<span
	class="catalog-fact"
	data-fact
	data-product={fact.productId}
	data-field={fact.field}
	data-source={fact.source}
	data-raw={JSON.stringify(fact.raw)}
>
	{fact.text}
</span>
