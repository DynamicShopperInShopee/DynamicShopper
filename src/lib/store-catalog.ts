export const categories = {
	mouse: { en: 'Gaming mice', th: 'เมาส์เกมมิ่ง' },
	earbuds: { en: 'Earbuds', th: 'หูฟัง' },
	power: { en: 'Power banks', th: 'พาวเวอร์แบงก์' },
	cooker: { en: 'Rice cookers', th: 'หม้อหุงข้าว' },
	skin: { en: 'Skincare', th: 'สกินแคร์' }
} as const;

export type Category = keyof typeof categories;
export type Language = 'en' | 'th';

type CatalogRow = [
	id: string,
	category: Category,
	nameEn: string,
	nameTh: string,
	shop: string,
	price: number,
	originalPrice: number | null,
	rating: number,
	sold: number,
	shipping: number
];

// Product facts transcribed from guidelines/CATALOG.md.
const rows: CatalogRow[] = [
	[
		'mouse-1',
		'mouse',
		'Nova Lite 62g wireless gaming mouse',
		'Nova Lite เมาส์เกมมิ่งไร้สาย น้ำหนัก 62 กรัม',
		'GamerZone Thailand',
		1290,
		1590,
		4.7,
		5200,
		40
	],
	[
		'mouse-2',
		'mouse',
		'Vortex W wireless mouse, 120h battery',
		'Vortex W เมาส์ไร้สาย แบตใช้งาน 120 ชั่วโมง',
		'TechHub Official Store',
		1190,
		1490,
		4.6,
		8100,
		0
	],
	[
		'mouse-3',
		'mouse',
		'Aero X 58g ultralight gaming mouse',
		'Aero X เมาส์เกมมิ่งน้ำหนักเบาพิเศษ 58 กรัม',
		'GamerZone Thailand',
		1450,
		null,
		4.8,
		3900,
		40
	],
	[
		'mouse-4',
		'mouse',
		'Blaze Pro RGB wireless gaming mouse',
		'Blaze Pro เมาส์เกมมิ่งไร้สายไฟ RGB',
		'TechHub Official Store',
		1890,
		2290,
		4.7,
		2600,
		0
	],
	[
		'mouse-5',
		'mouse',
		'Titan Max 30K sensor gaming mouse',
		'Titan Max เมาส์เกมมิ่งเซนเซอร์ 30K',
		'TechHub Official Store',
		2490,
		null,
		4.9,
		1500,
		0
	],
	[
		'mouse-6',
		'mouse',
		'Rogue O honeycomb gaming mouse 55g',
		'Rogue O เมาส์เกมมิ่งทรงรังผึ้ง น้ำหนัก 55 กรัม',
		'GamerZone Thailand',
		1690,
		1990,
		4.5,
		1100,
		40
	],
	[
		'mouse-7',
		'mouse',
		'Ergo G ergonomic wireless mouse',
		'Ergo G เมาส์เกมมิ่งไร้สายทรงถนัดมือ',
		'TechHub Official Store',
		1990,
		null,
		4.6,
		900,
		0
	],
	[
		'mouse-8',
		'mouse',
		'Pixel Mini compact gaming mouse',
		'Pixel Mini เมาส์เกมมิ่งไร้สายขนาดกะทัดรัด',
		'GamerZone Thailand',
		1590,
		null,
		4.4,
		700,
		40
	],
	[
		'earbuds-1',
		'earbuds',
		'QuietBuds Pro ANC earbuds',
		'QuietBuds Pro หูฟังตัดเสียงรบกวน',
		'AudioLab Mall',
		2490,
		3290,
		4.8,
		9800,
		0
	],
	[
		'earbuds-2',
		'earbuds',
		'PlayLite low-latency gaming earbuds',
		'PlayLite หูฟังเกมมิ่งเสียงหน่วงต่ำ',
		'AudioLab Mall',
		790,
		1190,
		4.5,
		12400,
		30
	],
	[
		'earbuds-3',
		'earbuds',
		'SportFit IPX5 sweatproof earbuds',
		'SportFit หูฟังทนเหงื่อ IPX5 สำหรับออกกำลังกาย',
		'GamerZone Thailand',
		990,
		null,
		4.4,
		4300,
		30
	],
	[
		'earbuds-4',
		'earbuds',
		'Studio X Hi-Res earbuds',
		'Studio X หูฟังเสียงความละเอียดสูง',
		'AudioLab Mall',
		3490,
		null,
		4.9,
		1400,
		0
	],
	[
		'earbuds-5',
		'earbuds',
		'DailyMini tiny Bluetooth earbuds',
		'DailyMini หูฟังบลูทูธขนาดเล็ก',
		'TechHub Official Store',
		590,
		null,
		4.3,
		21000,
		30
	],
	[
		'earbuds-6',
		'earbuds',
		'Neo ANC earbuds, 40h battery',
		'Neo หูฟังตัดเสียงรบกวน แบตใช้งาน 40 ชั่วโมง',
		'TechHub Official Store',
		1590,
		1990,
		4.6,
		6100,
		0
	],
	[
		'earbuds-7',
		'earbuds',
		'ClearCall earbuds with noise-reducing mic',
		'ClearCall หูฟังไมค์ลดเสียงรบกวน',
		'AudioLab Mall',
		1290,
		null,
		4.5,
		2200,
		30
	],
	[
		'power-1',
		'power',
		'SlimCharge 10000mAh slim power bank',
		'SlimCharge พาวเวอร์แบงก์ทรงบาง 10000 mAh',
		'TechHub Official Store',
		490,
		690,
		4.7,
		25000,
		0
	],
	[
		'power-2',
		'power',
		'FastPD 20000mAh 65W laptop power bank',
		'FastPD พาวเวอร์แบงก์สำหรับแล็ปท็อป 20000 mAh 65 W',
		'TechHub Official Store',
		1490,
		1890,
		4.8,
		7400,
		0
	],
	[
		'power-3',
		'power',
		'MagGo 5000mAh magnetic power bank',
		'MagGo พาวเวอร์แบงก์แม่เหล็ก 5000 mAh',
		'GamerZone Thailand',
		790,
		null,
		4.4,
		3600,
		30
	],
	[
		'power-4',
		'power',
		'MegaPower 30000mAh travel power bank',
		'MegaPower พาวเวอร์แบงก์สำหรับเดินทาง 30000 mAh',
		'TechHub Official Store',
		1190,
		null,
		4.6,
		4100,
		0
	],
	[
		'power-5',
		'power',
		'EcoBank 10000mAh budget power bank',
		'EcoBank พาวเวอร์แบงก์ราคาประหยัด 10000 mAh',
		'GamerZone Thailand',
		299,
		null,
		4.2,
		41000,
		30
	],
	[
		'power-6',
		'power',
		'SolarTrek 20000mAh solar waterproof power bank',
		'SolarTrek พาวเวอร์แบงก์โซลาร์กันน้ำ 20000 mAh',
		'GamerZone Thailand',
		890,
		null,
		4.3,
		1300,
		30
	],
	[
		'cooker-1',
		'cooker',
		'1.8L one-button electric rice cooker',
		'หม้อหุงข้าวไฟฟ้าปุ่มเดียว 1.8 ลิตร',
		'บ้านครัว HomeKrua',
		690,
		890,
		4.8,
		32000,
		50
	],
	[
		'cooker-2',
		'cooker',
		'1.0L digital rice cooker with timer',
		'หม้อหุงข้าวดิจิทัลตั้งเวลาได้ 1.0 ลิตร',
		'บ้านครัว HomeKrua',
		1290,
		null,
		4.7,
		9200,
		50
	],
	[
		'cooker-3',
		'cooker',
		'2.2L family rice cooker, 3-year warranty',
		'หม้อหุงข้าวสำหรับครอบครัว 2.2 ลิตร รับประกัน 3 ปี',
		'บ้านครัว HomeKrua',
		1590,
		1990,
		4.8,
		5300,
		0
	],
	[
		'cooker-4',
		'cooker',
		'0.8L mini rice cooker for 1-2 people',
		'หม้อหุงข้าวขนาดเล็ก 0.8 ลิตร สำหรับ 1–2 คน',
		'TechHub Official Store',
		450,
		null,
		4.5,
		18000,
		50
	],
	[
		'cooker-5',
		'cooker',
		'1.5L IH rice cooker, restaurant-quality rice',
		'หม้อหุงข้าวระบบเหนี่ยวนำ 1.5 ลิตร ข้าวสวยคุณภาพระดับร้านอาหาร',
		'TechHub Official Store',
		3290,
		3990,
		4.9,
		1800,
		0
	],
	[
		'cooker-6',
		'cooker',
		'1.8L rice cooker with steamer tray',
		'หม้อหุงข้าวพร้อมถาดนึ่ง 1.8 ลิตร',
		'บ้านครัว HomeKrua',
		890,
		null,
		4.6,
		11000,
		50
	],
	[
		'skin-1',
		'skin',
		'SPF50+ PA++++ lightweight sunscreen',
		'กันแดดเนื้อบางเบา SPF50+ PA++++',
		'Glow Skin Official',
		359,
		490,
		4.8,
		56000,
		0
	],
	[
		'skin-2',
		'skin',
		'15% Vitamin C brightening serum',
		'เซรั่มวิตามินซี 15% เพื่อผิวกระจ่างใส',
		'Glow Skin Official',
		590,
		null,
		4.7,
		24000,
		0
	],
	[
		'skin-3',
		'skin',
		'Oil-control cleansing gel for oily, acne-prone skin',
		'เจลล้างหน้าคุมมันสำหรับผิวเป็นสิวง่าย',
		'Glow Skin Official',
		189,
		null,
		4.6,
		38000,
		30
	],
	[
		'skin-4',
		'skin',
		'Ceramide moisturiser for dry skin, 24h hydration',
		'มอยส์เจอไรเซอร์เซราไมด์สำหรับผิวแห้ง ให้ความชุ่มชื้น 24 ชั่วโมง',
		'Glow Skin Official',
		450,
		590,
		4.7,
		15000,
		30
	],
	[
		'skin-5',
		'skin',
		'SPF35 gentle sunscreen for sensitive skin',
		'กันแดดสูตรอ่อนโยนสำหรับผิวแพ้ง่าย SPF35',
		'Glow Skin Official',
		420,
		null,
		4.7,
		9000,
		30
	],
	[
		'skin-6',
		'skin',
		'Hyaluronic sheet masks, 10 pack',
		'แผ่นมาสก์หน้าไฮยาลูรอน 10 แผ่น',
		'Glow Skin Official',
		249,
		349,
		4.5,
		29000,
		30
	]
];

export const catalog = rows.map(
	([id, category, en, th, shop, price, originalPrice, rating, sold, shipping]) => ({
		id,
		category,
		name: { en, th },
		shop,
		price,
		originalPrice,
		rating,
		sold,
		shipping
	})
);
