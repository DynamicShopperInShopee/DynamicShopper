<script lang="ts">
	import type { PageData } from './$types';
	let { specs, th }: { specs: PageData['specs']; th: boolean } = $props();
</script>

<section aria-label={th ? 'คุณลักษณะสินค้า' : 'Product specifications'}>
	<dl class="feature-grid">
		{#each specs as spec (spec.attributes['data-fact'])}
			<div>
				<dt>
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
				<dd {...spec.attributes}>{spec.text}</dd>
			</div>
		{/each}
	</dl>
</section>

<style>
	section {
		background: #f6f6f4;
		padding: 1.25rem 0.5rem;
	}
	dl,
	dd {
		margin: 0;
	}
	dd {
		font-family: var(--product-figure-font);
	}
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2px;
		max-width: 36rem;
		margin-inline: auto;
	}
	.feature-grid div {
		display: block;
		background: #f6f6f4;
		text-align: center;
		padding: 1.1rem 0.6rem;
	}
	.feature-grid dt {
		display: grid;
		justify-items: center;
		gap: 0.3rem;
	}
	.feature-grid dd {
		font-weight: 700;
	}
</style>
