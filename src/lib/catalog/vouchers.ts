export type Voucher = Readonly<{
	code: string;
	kind: 'shop' | 'platform' | 'shipping';
	shopId?: string;
	minSpend: number;
	discount: Readonly<
		{ kind: 'fixed'; amount: number } | { kind: 'percent'; percent: number; cap: number }
	>;
	expiresAfterMs: number;
}>;

const hour = 60 * 60 * 1000;
const valid = 7 * 24 * hour;

export const vouchers: readonly Voucher[] = [
	{
		code: 'TECH100',
		kind: 'shop',
		shopId: 'techhub',
		minSpend: 1000,
		discount: { kind: 'fixed', amount: 100 },
		expiresAfterMs: valid
	},
	{
		code: 'GAMER10',
		kind: 'shop',
		shopId: 'gamerzone',
		minSpend: 800,
		discount: { kind: 'percent', percent: 10, cap: 150 },
		expiresAfterMs: valid
	},
	{
		code: 'AUDIO200',
		kind: 'shop',
		shopId: 'audiolab',
		minSpend: 1500,
		discount: { kind: 'fixed', amount: 200 },
		expiresAfterMs: valid
	},
	{
		code: 'KRUA150',
		kind: 'shop',
		shopId: 'homekrua',
		minSpend: 1200,
		discount: { kind: 'fixed', amount: 150 },
		expiresAfterMs: valid
	},
	{
		code: 'GLOW15',
		kind: 'shop',
		shopId: 'glow-skin',
		minSpend: 500,
		discount: { kind: 'percent', percent: 15, cap: 100 },
		expiresAfterMs: valid
	},
	{
		code: 'SAVE50',
		kind: 'platform',
		minSpend: 300,
		discount: { kind: 'fixed', amount: 50 },
		expiresAfterMs: valid
	},
	{
		code: 'MEGA8',
		kind: 'platform',
		minSpend: 1000,
		discount: { kind: 'percent', percent: 8, cap: 300 },
		expiresAfterMs: 12 * hour
	},
	{
		code: 'FLASH100',
		kind: 'platform',
		minSpend: 500,
		discount: { kind: 'fixed', amount: 100 },
		expiresAfterMs: -hour
	},
	{
		code: 'SHIP40',
		kind: 'shipping',
		minSpend: 300,
		discount: { kind: 'fixed', amount: 40 },
		expiresAfterMs: valid
	},
	{
		code: 'SHIP60',
		kind: 'shipping',
		minSpend: 1500,
		discount: { kind: 'fixed', amount: 60 },
		expiresAfterMs: valid
	}
];
