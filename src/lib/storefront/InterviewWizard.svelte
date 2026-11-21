<script lang="ts">
	import type { ShopperPlan } from '../personalization/plan';
	import { interviewProposal, describePatch, type Answers } from '../personalization/interview';
	type InterviewView = { plan: ShopperPlan; lockedFields: (keyof ShopperPlan)[]; interview: { answers: Answers } | null };
	type Message = { role: 'assistant' | 'user'; content: string };
	let { view, onapply }: { view: InterviewView; onapply: (answers: Answers, directOnly: boolean) => void } = $props();
	let messages = $state<Message[]>([]);
	let answers = $state<Answers>({});
	let text = $state('');
	let busy = $state(false);
	let complete = $state(false);
	let failure = $state(false);
	let directOnly = $state(false);
	let transcript = $state<HTMLDivElement>();
	const lang = $derived(view.plan.locale);
	const t = (en: string, th: string) => lang === 'th' ? th : en;
	const result = $derived(interviewProposal(answers, view.plan, { directOnly, lockedFields: view.lockedFields }));
	const changes = $derived(describePatch(Object.fromEntries(Object.entries(result.patch).filter(([key, value]) => JSON.stringify(view.plan[key as keyof ShopperPlan]) !== JSON.stringify(value))), lang));
	const fromModelAnswers = (raw: Record<string, string | null>): Answers => ({
		...(raw.goal ? { goal: ({ compare: 'compare', discover: 'browse', quick: 'shortlist', someone: 'gift' } as Record<string, string>)[raw.goal] } : {}),
		...(raw.matters ? { priority: ({ price: 'value', quality: 'durability', design: 'value', performance: 'performance', ease: 'rating', delivery: 'value' } as Record<string, string>)[raw.matters] } : {}),
		...(raw.detail ? { evidence: ({ simple: 'summary', balanced: 'specs', detailed: 'specs' } as Record<string, string>)[raw.detail] } : {}),
		...(raw.help ? { goal: ({ 'best-total': 'shortlist', comparison: 'compare', 'complete-set': 'gift', refills: 'gift', none: 'browse' } as Record<string, string>)[raw.help] } : {}),
		...(raw.access === 'larger-text' ? { reading: 'large' } : raw.access === 'standard' ? { reading: 'comfortable' } : {})
	});
	async function send(message: string) {
		if (busy || !message.trim()) return;
		busy = true; failure = false; text = '';
		try {
			const response = await fetch('/api/interview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ locale: lang, history: messages, message: message.trim() }) });
			if (!response.ok) throw new Error('Interview unavailable');
			const data = await response.json() as { reply: string; complete: boolean; answers: Record<string, string | null> };
			answers = fromModelAnswers(data.answers);
			messages = [...messages, { role: 'user', content: message.trim() }, { role: 'assistant', content: data.reply }];
			complete = data.complete;
			await Promise.resolve();
			transcript?.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
		} catch { failure = true; }
		finally { busy = false; }
	}
	function start() { void send(t('Help me personalize my shop. Ask me one question at a time.', 'ช่วยปรับหน้าร้านให้เหมาะกับฉัน ถามทีละข้อได้เลย')); }
	function apply() { onapply(answers, directOnly); }
</script>

<div class="step-content">
	<h3>{t('Let’s shape your shop', 'มาปรับหน้าร้านให้เหมาะกับคุณ')}</h3>
	<p class="intro">{t('The assistant will ask follow-up questions. Review the proposed preset before it changes your shop.', 'ผู้ช่วยจะถามต่อจากคำตอบของคุณ คุณตรวจดูรูปแบบที่เสนอได้ก่อนเปลี่ยนหน้าร้าน')}</p>
	<div class="conversation" bind:this={transcript} aria-live="polite" aria-label={t('Interview conversation', 'บทสนทนาสัมภาษณ์')}>
		{#if !messages.length}<p class="empty">{t('Start the interview to begin.', 'เริ่มสัมภาษณ์เพื่อพูดคุย')}</p>{/if}
		{#each messages as message, index (`${message.role}-${index}`)}
			<p class:shopper={message.role === 'user'} class:assistant={message.role === 'assistant'}>{message.content}</p>
		{/each}
		{#if busy}<p class="status">{t('Thinking…', 'กำลังคิด…')}</p>{/if}
	</div>
	{#if failure}<p role="alert">{t('The interview service is unavailable. Try again, or use the offline controls in chat.', 'บริการสัมภาษณ์ใช้งานไม่ได้ ลองอีกครั้งหรือปรับหน้าร้านผ่านแชตแบบออฟไลน์')}</p>{/if}
	{#if complete}
		<section class="preview" aria-label={t('Proposed view', 'มุมมองที่เสนอ')}>
			<strong>{t('Review your proposed view', 'ตรวจมุมมองที่เสนอ')}</strong>
			{#if changes.length}<dl>{#each changes as item (item.field)}<div><dt>{item.label}</dt><dd>{item.text}</dd></div>{/each}</dl>
			{:else}<p>{t('Your current view already matches these preferences.', 'มุมมองปัจจุบันตรงกับความชอบนี้แล้ว')}</p>{/if}
			<p>{t('Product facts stay unchanged. You can undo this change after applying.', 'ข้อมูลสินค้าคงเดิม และย้อนกลับได้หลังปรับใช้')}</p>
		</section>
		<details><summary>{t('How this view is chosen', 'มุมมองนี้เลือกมาอย่างไร')}</summary>
			<p>{t('OpenAI conducts the interview. Only the fixed local preset validator can change presentation settings.', 'OpenAI ช่วยสัมภาษณ์ ส่วนตัวตรวจสอบรูปแบบที่กำหนดไว้เท่านั้นที่เปลี่ยนการแสดงผลได้')}</p>
			<label class="direct"><input type="checkbox" bind:checked={directOnly}/><span>{t('Use direct answers only', 'ใช้เฉพาะคำตอบที่ระบุชัดเจน')}</span></label>
		</details>
	{:else}
		<form class="composer" onsubmit={(event) => { event.preventDefault(); void send(text); }}>
			<label class="sr-only" for="interview-reply">{t('Your answer', 'คำตอบของคุณ')}</label>
			<textarea id="interview-reply" bind:value={text} maxlength="500" rows="2" disabled={busy} placeholder={t('Type your answer…', 'พิมพ์คำตอบ…')}></textarea>
			<button class="primary" disabled={busy || !text.trim()}>{t('Reply', 'ตอบ')}</button>
		</form>
	{/if}
</div>
<div class="apply">
	{#if !messages.length}<button class="primary" onclick={start} disabled={busy}>{t('Start interview', 'เริ่มสัมภาษณ์')}</button>
	{:else if complete}<button class="back" onclick={() => { complete = false; }}>{t('Continue interview', 'สัมภาษณ์ต่อ')}</button><button class="primary" onclick={apply}>{t('Apply my view', 'ใช้มุมมองนี้')}</button>{/if}
</div>

<style>
	.step-content{display:grid;gap:1rem;padding:1.125rem}.conversation{display:flex;flex-direction:column;gap:.5rem;max-height:32vh;overflow:auto;border-block:1px solid var(--seam);padding:.75rem 0}.conversation p{max-width:90%;padding:.65rem .8rem;margin:0;line-height:1.5}.assistant{align-self:start;background:var(--surface);border:1px solid var(--seam)}.shopper{align-self:end;background:var(--surface);border:1px solid var(--accent)}.status,.empty{color:var(--muted)}.composer{display:flex;align-items:end;gap:.5rem}.composer textarea{flex:1;min-width:0;resize:vertical;font:inherit;padding:.7rem;border:1px solid var(--seam);background:var(--surface);color:var(--ink)}button{font:inherit;font-weight:600;min-height:var(--tap);padding-inline:1rem;border:1px solid var(--seam);border-radius:var(--radius);color:var(--ink);background:var(--surface);cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}.primary{background:var(--accent);color:white;border-color:var(--accent)}.preview{background:var(--surface);border-block:1px dashed var(--muted);padding:.6rem .875rem}.preview dl div{display:grid;grid-template-columns:minmax(5rem,1fr) minmax(0,2fr);gap:.75rem;padding:.4rem 0;border-bottom:1px dotted var(--seam)}dt{color:var(--muted)}dd{margin:0;font-weight:600}p{line-height:1.55}summary{cursor:pointer;min-height:var(--tap);padding-block:.65rem;font-weight:600}.direct{display:flex;align-items:center;gap:.6rem;min-height:var(--tap)}.apply{position:sticky;bottom:0;display:flex;justify-content:flex-end;gap:.75rem;padding:.65rem 1.125rem max(.65rem,env(safe-area-inset-bottom));background:var(--paper);border-top:1px solid var(--seam)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.intro{margin:0;color:var(--muted)}@media(max-width:520px){.apply button{flex:1}}
</style>
