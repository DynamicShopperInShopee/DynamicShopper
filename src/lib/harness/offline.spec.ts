import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { maskAmounts, parseBudget } from './budget.ts';
import { defaultCatalog as catalog } from './catalog-port.ts';
import { interpretOffline } from './offline.ts';
import { mergePlan, standardPlan } from './plan.ts';
import { initialState } from './store.ts';
import { handleTurn, shownProducts } from './turn.ts';
import type { StoreState } from './types.ts';

const clock = { openedAt: 1_800_000_000_000, now: 1_800_000_000_000 };
const deps = { catalog, clock };
const mice: StoreState = {
	...initialState(),
	plan: mergePlan(standardPlan, { query: 'gaming mouse' }, catalog)
};
const offline = (message: string, state: StoreState = initialState()) =>
	interpretOffline(message, state, catalog, shownProducts(state, catalog));

describe('R14 · budgets are read locally and carefully', () => {
	it.each([
		['งบ 1000', 1000],
		['within 800', 800],
		['1.5k', 1500],
		['2 พัน', 2000],
		['ขอเมาส์เกมมิ่งไม่เกิน 1500 บาท', 1500],
		['under ฿1,500', 1500],
		['show me gaming mice under 1500', 1500],
		['หา gaming mouse ไม่เกิน 2000 บาท', 2000],
		['งบ ๑๕๐๐', 1500],
		['budget around 900 baht', 900],
		['no more than 1500 baht', 1500],
		['ไม่มากกว่า 800', 800],
		['not over 900', 900],
		['under 2 thousand baht', 2000],
		['up to 1.5 thousand', 1500],
		['under １５００ baht please', 1500],
		['งบไม่เกิน ٨٠٠', 800],
		['งบ 1000 ตัวไหนดี', 1000]
	])('"%s" is a budget of %d', (message, amount) => {
		expect(parseBudget(message)).toBe(amount);
	});

	it.each([
		'65W charger',
		'หม้อ 2 ลิตร',
		'70 grams or less',
		'ส่งภายใน 3 วัน',
		'below 5 stars',
		'ซื้อให้แม่ อายุ 65',
		'ไม่ต่ำกว่า 500',
		'at least 500 baht',
		'Titan Max 30K sensor',
		'compare the top 3',
		'not less than 1000 baht',
		'no less than 900',
		'ขอ 2 พันธุ์',
		'มี 1290 ตัวไหนดี'
	])('"%s" sets no price cap', (message) => {
		expect(parseBudget(message)).toBeNull();
	});

	it('masks every amount before text could reach a model, keeping units and small counts', () => {
		expect(maskAmounts('under 1500 baht, 65W, top 3')).toBe('under [amount] baht, 65W, top 3');
		expect(maskAmounts('only ฿9 today')).toBe('only [amount] today');
		expect(maskAmounts('งบ ๑๒๐๐ บาท')).not.toMatch(/\d{3}/);
		expect(maskAmounts('มี 1290 ตัวไหนดี')).not.toContain('1290');
		expect(maskAmounts('I can spend 2 thousand baht')).not.toMatch(/2 thousand/);
		expect(maskAmounts('under １５００ baht please')).not.toMatch(/[\p{Nd}]{2}/u);
		expect(maskAmounts('only ½ price, ① left')).not.toMatch(/[½①]/);
	});
});

describe('R14 · the keyword fallback understands plain Thai, English and mixed text', () => {
	let fetchSpy: ReturnType<typeof vi.fn>;
	beforeEach(() => {
		fetchSpy = vi.fn(() => {
			throw new Error('network used');
		});
		vi.stubGlobal('fetch', fetchSpy);
	});
	afterEach(() => vi.unstubAllGlobals());

	it('restyles: "ขอแบบเรียบๆ ดูสเปกก่อน" gives a minimal, spec-first table, replied in Thai', () => {
		const envelope = offline('ขอแบบเรียบๆ ดูสเปกก่อน', mice);
		expect(envelope.intent).toBe('restyle');
		expect(envelope.patch).toMatchObject({ theme: 'minimal', layout: 'table' });
		expect((envelope.patch?.cardFields as string[])[0]).toBe('specs');
		const turn = handleTurn(mice, { message: 'ขอแบบเรียบๆ ดูสเปกก่อน' }, deps);
		expect(turn.turn.reply.lang).toBe('th');
		expect(turn.state.plan.theme).toBe('minimal');
		expect(turn.backend).toBe('offline');
		expect(turn.trace.fallbackReason).toBe('no_key');
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('searches with spec preferences and a local budget: Aero X leads three mice', () => {
		const turn = handleTurn(
			mice,
			{ message: 'I care about battery and light weight, under 1500 baht' },
			deps
		);
		expect(turn.turn.intent).toBe('search');
		expect(turn.state.plan.filters.maxPrice).toBe(1500);
		expect(turn.state.plan.specPrefs.map((p) => p.key).sort()).toEqual(['battery', 'weight']);
		expect(turn.ranked.map((row) => row.product.id)[0]).toBe('aero-x');
		expect(turn.ranked).toHaveLength(3);
	});

	it('mom phrasing gives the mom persona with rice cookers, in Thai', () => {
		const turn = handleTurn(initialState(), { message: 'ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ' }, deps);
		expect(turn.turn.intent).toBe('persona');
		expect(turn.state.plan).toMatchObject({
			theme: 'large-print',
			language: 'th',
			simplified: true
		});
		expect(turn.state.plan.filters.category).toBe('rice-cooker');
		expect(turn.state.plan.sections).toEqual([
			'top-picks',
			'what-matters',
			'best-deal',
			'share',
			'products'
		]);
		expect(turn.ranked).toHaveLength(3);
	});

	it('composes pages: compare, gift and best-value phrasing lead with the right sections', () => {
		expect(offline('earbuds for the gym, compare the top 3').patch?.sections).toEqual([
			'compare',
			'reviews',
			'products'
		]);
		expect(offline('a gift for my friend').patch?.sections).toEqual([
			'top-picks',
			'reviews',
			'products'
		]);
		expect(offline('build me a best value page for skincare').patch?.sections).toEqual([
			'top-picks',
			'best-deal',
			'products'
		]);
		expect(offline('compare หูฟัง 3 ตัวแล้วแชร์ให้เพื่อนหน่อย').patch?.sections).toEqual([
			'compare',
			'reviews',
			'share',
			'products'
		]);
	});

	it('recognises reset, undo, deal and chat', () => {
		expect(offline('start over').intent).toBe('reset');
		expect(offline('เริ่มใหม่').intent).toBe('reset');
		expect(offline('undo that').intent).toBe('undo');
		expect(offline('ย้อนกลับ').intent).toBe('undo');
		expect(offline('cheapest way to get this?').intent).toBe('find_deal');
		expect(offline('มีโค้ดส่วนลดไหม').intent).toBe('find_deal');
		expect(offline('hello there').intent).toBe('chat');
	});

	it('answers listing questions with citations, and declines what the listing does not cover', () => {
		const focused = { ...mice, focus: ['aero-x'] };
		const battery = offline('does the battery last all day?', focused);
		expect(battery.intent).toBe('ask');
		expect(battery.citations).toEqual([{ productId: 'aero-x', kind: 'spec', key: 'battery' }]);
		expect(offline('ตัวนี้แบตอยู่ได้นานไหม', focused).citations).toEqual([
			{ productId: 'aero-x', kind: 'spec', key: 'battery' }
		]);
		const earbuds = { ...initialState(), focus: ['sportfit'] };
		const waterproof = handleTurn(earbuds, { message: 'is this one waterproof?' }, deps);
		expect(waterproof.turn.intent).toBe('ask');
		expect(waterproof.turn.reply.text).toBe("I can't confirm that from the listing.");
		const thai = handleTurn(earbuds, { message: 'กันน้ำไหม' }, deps);
		expect(thai.turn.reply.text).toBe('ไม่สามารถยืนยันเรื่องนี้จากรายละเอียดสินค้าได้');
	});

	it.each([
		['make the font bigger, please', 'large-print'],
		['make the text bigger please, my eyes are tired', 'large-print'],
		['ขอหน้าร้านจอยๆ', 'vibrant'],
		['make it pop', 'vibrant'],
		['ขอคลีนๆ ไม่รก', 'minimal']
	])('understands conversational presentation request: %s', (message, theme) => {
		const result = handleTurn(initialState(), { message }, deps);
		expect(result.turn.intent).toBe('restyle');
		expect(result.state.plan.theme).toBe(theme);
	});

	it('understands price aversion, parent synonyms and a specs-only request', () => {
		const affordable = handleTurn(initialState(), { message: 'ไม่เอาแพง หูฟังสักคู่' }, deps);
		expect(affordable.state.plan.filters.category).toBe('earbuds');
		expect(affordable.state.plan.priorities.price).toBe(1);
		expect(handleTurn(initialState(), { message: 'ของขวัญให้ป๊า ใช้ง่ายๆ' }, deps).turn.intent).toBe(
			'persona'
		);
		expect(
			handleTurn(mice, { message: 'just the specs, no fluff' }, deps).state.plan.cardFields[0]
		).toBe('specs');
	});

	it('a question referring to the current listing may name its category without changing the store', () => {
		const focused = { ...initialState(), focus: ['sportfit'] };
		for (const message of ['หูฟังตัวนี้กันน้ำไหม', 'are these earbuds waterproof?']) {
			const result = handleTurn(focused, { message }, deps);
			expect(result.turn.intent).toBe('ask');
			expect(result.state).toBe(focused);
			expect(result.turn).toMatchObject({ citations: [] });
		}
		const battery = handleTurn(
			{ ...mice, focus: ['aero-x'] },
			{ message: 'does this mouse battery last all day?' },
			deps
		);
		expect(battery.turn).toMatchObject({
			intent: 'ask',
			citations: [{ productId: 'aero-x', kind: 'spec', key: 'battery' }]
		});
		expect(offline('which earbuds are cheap under 1000?').intent).toBe('search');
	});

	it.each([
		[['aero-x'], 'are these earbuds wireless?'],
		[[], 'are these earbuds wireless?'],
		[['sportfit'], 'does this mouse battery last all day?']
	])(
		'declines category-mismatched listing questions without changing the store: %s / %s',
		(focus, message) => {
			const state = { ...mice, focus };
			const result = handleTurn(state, { message }, deps);
			expect(result.state).toBe(state);
			expect(result.turn).toMatchObject({ intent: 'ask', citations: [] });
			expect(result.turn.reply.text).toBe("I can't confirm that from the listing.");
		}
	);

	it('replies in Thai to Thai script and in the interface language otherwise', () => {
		expect(handleTurn(initialState(), { message: 'ขอสีสันสดใส' }, deps).turn.reply.lang).toBe('th');
		expect(handleTurn(initialState(), { message: 'make it colourful' }, deps).turn.reply.lang).toBe(
			'en'
		);
		expect(
			handleTurn(initialState(), { message: 'switch to thai please' }, deps).turn.reply.lang
		).toBe('th');
	});

	it('only ever replies with fixed templates (digit-free)', () => {
		for (const message of ['งบ 1000 หูฟัง', 'under 1500', 'ขอ 3 ตัว', 'price 99999 baht']) {
			expect(offline(message).reply).not.toMatch(/[\p{Nd}\p{Sc}]/u);
		}
	});
});
