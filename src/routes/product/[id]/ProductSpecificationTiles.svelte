<script lang="ts">
	import type { PageData } from './$types';
	let { specs, th }: { specs: PageData['specs']; th: boolean } = $props();
</script>

<section class="bg-[#f6f6f4] px-2 py-5" aria-label={th ? 'คุณลักษณะสินค้า' : 'Product specifications'}>
	<dl class="feature-grid mx-auto my-0 grid max-w-xl grid-cols-2 gap-0.5">
		{#each specs as spec (spec.attributes['data-fact'])}
			<div class="block bg-[#f6f6f4] px-[0.6rem] py-[1.1rem] text-center">
				<dt class="grid justify-items-center gap-[0.3rem]">
					<svg
						width="32"
						height="32"
						viewBox="0 0 32 32"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						aria-hidden="true"
					>
						{#if spec.attributes['data-fact'] === 'spec.capacity'}
							<path d="M4 10h24l-3 14H7zM7 26h18M9 13h5m-5 4h3" />
						{:else if spec.attributes['data-fact'] === 'spec.power'}
							<path d="m18 3-12 16h9l-1 10 12-17h-9z" />
						{:else if spec.attributes['data-fact'] === 'spec.programs'}
							<path
								d="M4 15h24M6 16v7q0 3 3 3h14q3 0 3-3v-7M8 12q8-7 16 0M14 8h4M11 6l1-3m6 3 1-3"
							/>
						{:else}
							<path
								d="M16 3c4 3 8 4 11 4v9c0 7-8 11-11 13C12 27 5 23 5 16V7c4 0 8-2 11-4zM11 16l4 4 7-8"
							/>
						{/if}
					</svg>
					{spec.label}
				</dt>
				<dd
					class="m-0 font-[family-name:var(--product-figure-font)] font-bold"
					{...spec.attributes}
				>
					{spec.text}
				</dd>
			</div>
		{/each}
	</dl>
</section>
