import type {
	DealReceipt,
	Language,
	Plan,
	Product,
	RankTerm,
	StoreState,
	Turn
} from '#lib/contracts.ts';

const anchorProduct = {
	id: 'cooker-one-button',
	category: 'rice-cooker',
	shopId: 'homekrua',
	name: {
		en: '1.8L one-button electric rice cooker',
		th: 'หม้อหุงข้าวไฟฟ้าแบบปุ่มเดียว 1.8 ลิตร'
	},
	price: 690,
	originalPrice: 890,
	rating: 4.8,
	reviewCount: 2840,
	sold: 32000,
	shipping: 50,
	specs: { capacity: 1.8, power: 700, programs: 2, warranty: 2 },
	summary: {
		en: 'A simple cooker with one button and a clear indicator.',
		th: 'หม้อหุงข้าวปุ่มเดียว ใช้ง่าย มีไฟแสดงสถานะชัดเจน'
	},
	reviews: [
		{ en: 'Mom uses it without help', th: 'แม่ใช้เองได้ ไม่ต้องคอยช่วย' },
		{
			en: 'The light makes it easy to tell when the rice is ready.',
			th: 'ดูไฟก็รู้ว่าข้าวสุกแล้ว'
		}
	],
	tags: ['simple', 'one button', 'seniors', 'family'],
	scores: { performance: 0.7, durability: 0.82, design: 0.76, value: 0.94 }
} as const satisfies Product;

const openingPlan = {
	theme: 'standard',
	layout: 'grid',
	density: 'comfortable',
	language: 'en',
	cardFields: ['image', 'price', 'rating', 'shop', 'shipping'],
	highlightedSpecs: [],
	searchWords: ['rice', 'cooker'],
	category: 'rice-cooker',
	maxPrice: null,
	shopIds: [],
	mallOnly: false,
	simplified: false,
	sections: ['products'],
	priorities: { rating: 1, value: 0.5 },
	specPreferences: {}
} as const satisfies Plan;

const openingState = {
	plan: openingPlan,
	explicit: {
		fields: ['language'],
		priorities: [],
		specPreferences: []
	},
	undo: [],
	focusProductId: anchorProduct.id,
	cart: [{ productId: anchorProduct.id, quantity: 1 }],
	lastTurn: null
} as const satisfies StoreState;

const modelTrace = {
	backend: 'model',
	reason: 'completed',
	tools: [],
	rounds: 0,
	elapsedMs: 0,
	dropped: ['invalid-section'],
	guarded: false
} as const;

const offlineTrace = {
	...modelTrace,
	backend: 'offline',
	dropped: []
} as const;

const mixedTurn = {
	intent: 'change',
	patch: { theme: 'minimal' },
	reply: 'I updated the store.',
	trace: modelTrace
} as const satisfies Turn;

const noOpTurn = {
	intent: 'change',
	patch: { theme: 'minimal' },
	reply: 'The store already matches that preference.',
	trace: { ...modelTrace, backend: 'direct', dropped: [] }
} as const satisfies Turn;

const questionTurn = {
	intent: 'ask',
	citations: [{ productId: anchorProduct.id, field: 'spec.capacity' }],
	reply: 'I found this in the listing.',
	trace: offlineTrace
} as const satisfies Turn;

type VisibleFactSample = Readonly<Record<string, Readonly<Record<Language, string>>>>;

const openedAt = Date.parse('2026-11-21T03:30:00Z');
const basket = [{ productId: anchorProduct.id, quantity: 1 }] as const;
const pricedItem = {
	productId: anchorProduct.id,
	quantity: 1,
	shopId: anchorProduct.shopId,
	unitPrice: 690,
	subtotal: 690
} as const;

export const contractSample = {
	anchorProduct,
	products: [anchorProduct] as const,
	visibleFacts: {
		price: { en: '฿690', th: '690 บาท' },
		originalPrice: { en: '฿890', th: '890 บาท' },
		shipping: { en: '฿50', th: '50 บาท' },
		capacity: { en: '1.8 L', th: '1.8 ลิตร' },
		warranty: { en: '2 yr', th: '2 ปี' }
	} satisfies VisibleFactSample,
	missingFact: {
		productId: anchorProduct.id,
		field: 'spec.temperature',
		expected: undefined
	},
	openedAt,
	basket,
	pricingContext: { openedAt, now: openedAt, coinBalance: 1200 },
	expectedDeal: {
		items: [pricedItem],
		shops: [
			{
				shopId: 'homekrua',
				items: [pricedItem],
				subtotal: 690,
				shipping: 50
			}
		],
		subtotal: 690,
		shipping: 50,
		baseline: 740,
		appliedVouchers: [
			{ code: 'SAVE50', kind: 'platform', expiresSoon: false, amount: 50 },
			{ code: 'SHIP40', kind: 'shipping', expiresSoon: false, amount: 40 }
		],
		coinsUsed: 65,
		total: 585,
		savings: 155,
		unusedVouchers: [
			{
				code: 'MEGA8',
				kind: 'platform',
				expiresSoon: true,
				reason: 'minimum-spend',
				gap: 310
			},
			{
				code: 'KRUA150',
				kind: 'shop',
				shopId: 'homekrua',
				expiresSoon: false,
				reason: 'minimum-spend',
				gap: 510
			},
			{
				code: 'SHIP60',
				kind: 'shipping',
				expiresSoon: false,
				reason: 'minimum-spend',
				gap: 810
			},
			{
				code: 'FLASH100',
				kind: 'platform',
				expiresSoon: false,
				reason: 'expired'
			},
			{
				code: 'AUDIO200',
				kind: 'shop',
				shopId: 'audiolab',
				expiresSoon: false,
				reason: 'no-eligible-item'
			},
			{
				code: 'GAMER10',
				kind: 'shop',
				shopId: 'gamerzone',
				expiresSoon: false,
				reason: 'no-eligible-item'
			},
			{
				code: 'GLOW15',
				kind: 'shop',
				shopId: 'glow-skin',
				expiresSoon: false,
				reason: 'no-eligible-item'
			},
			{
				code: 'TECH100',
				kind: 'shop',
				shopId: 'techhub',
				expiresSoon: false,
				reason: 'no-eligible-item'
			}
		]
	} satisfies DealReceipt,
	styleRequest: 'ขอแบบเรียบ อ่านง่าย',
	mixedProposal: {
		intent: 'change',
		patch: { theme: 'minimal', sections: ['unknown-section'] },
		reply: 'I updated the store.'
	},
	mixedTurn,
	openingState,
	noOpTurn,
	expectedRankingTerms: [
		{ kind: 'priority', key: 'value', strength: 'full' }
	] as readonly RankTerm[],
	directLanguageMessage: 'I am shopping for my mom',
	undoMessage: 'undo',
	questionMessage: 'หม้อใบนี้จุเท่าไร',
	questionTurn
} as const;
