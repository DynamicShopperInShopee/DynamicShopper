<script lang="ts">
	import { tick } from 'svelte';
	import type { ShopperPlan } from '../personalization/plan';
	import type { Answers, ProposalSources } from '../personalization/interview';
	import InterviewForm from './InterviewForm.svelte';
	let {
		plan,
		themeLocked,
		enabled,
		onapply
	}: {
		plan: ShopperPlan;
		themeLocked: boolean;
		enabled: boolean;
		onapply: (patch: Partial<ShopperPlan>, sources: ProposalSources) => void;
	} = $props();
	let dialog = $state<HTMLDialogElement>();
	let trigger = $state<HTMLButtonElement>();
	let open = $state(false);
	let answers = $state<Answers>({});
	let directOnly = $state(false);
	const t = (en: string, th: string) => (plan.locale === 'th' ? th : en);
	async function show() {
		open = true;
		await tick();
		dialog?.showModal();
	}
	function close() {
		dialog?.close();
		open = false;
		trigger?.focus();
	}
	async function apply(
		next: Answers,
		direct: boolean,
		patch: Partial<ShopperPlan>,
		sources: ProposalSources
	) {
		answers = next;
		directOnly = direct;
		close();
		onapply(patch, sources);
		await tick();
		document.getElementById('products')?.focus({ preventScroll: true });
		document.getElementById('products')?.scrollIntoView({ block: 'start' });
	}
</script>

<section class="personalize-entry" aria-label={t('Your shopping view', 'มุมมองการเลือกซื้อ')}>
	<div>
		<strong>{t('Shop your way', 'เลือกซื้อในแบบของคุณ')}</strong>
		<p>{t('Choose how you browse, compare and read.', 'เลือกรูปแบบการดู เปรียบเทียบ และการอ่าน')}</p>
	</div>
	<button bind:this={trigger} disabled={!enabled} aria-haspopup="dialog" onclick={show}>
		{t('Adjust my view', 'ปรับมุมมองของฉัน')}
	</button>
</section>
{#if open}
	<dialog bind:this={dialog} oncancel={close} aria-labelledby="interview-title">
		<header>
			<h2 id="interview-title">{t('Make this shop fit you', 'ปรับร้านให้เหมาะกับคุณ')}</h2>
			<button aria-label={t('Close interview', 'ปิดการปรับมุมมอง')} onclick={close}>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					aria-hidden="true"
				>
					<path d="m6 6 12 12M18 6 6 18" />
				</svg>
			</button>
		</header>
		<div class="interview-content">
			<InterviewForm
				{plan}
				{themeLocked}
				initialAnswers={answers}
				initialDirectOnly={directOnly}
				onapply={apply}
			/>
		</div>
	</dialog>
{/if}

<style>
	.personalize-entry {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 16px;
		margin: 12px 0;
		background: var(--surface);
		border: 1px solid var(--seam);
		font-size: var(--small);
	}
	p {
		color: var(--muted);
		margin: 4px 0 0;
	}
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font: inherit;
		min-height: var(--tap);
		padding: 8px 12px;
		color: var(--accent);
		background: var(--surface);
		border: 1px solid var(--accent);
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
	:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
	dialog {
		color: var(--ink);
		background: var(--paper);
		border: 1px solid var(--muted);
		width: min(560px, calc(100% - 24px));
		max-height: 88dvh;
		padding: 0;
		font: inherit;
		margin: auto;
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 45%);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 20px;
		background: var(--paper);
		border-bottom: 1px solid var(--seam);
		position: sticky;
		top: 0;
		z-index: 1;
	}
	h2 {
		font-size: max(20px, var(--size));
		line-height: 1.4;
		margin: 0;
	}
	header button {
		min-width: 48px;
		min-height: 48px;
		border: 0;
		padding: 0;
	}
	.interview-content {
		padding: 20px;
	}
	@media (max-width: 700px) {
		.personalize-entry {
			flex-wrap: wrap;
			padding: 12px;
		}
		.personalize-entry p {
			display: none;
		}
		dialog {
			width: 100%;
			max-width: 100%;
			margin: auto 0 0;
			border-bottom: 0;
		}
		.interview-content {
			padding-bottom: calc(20px + env(safe-area-inset-bottom));
		}
	}
</style>
