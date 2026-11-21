/** Authored design recipes. These never enter the AI prompt or alter the shop plan. */
export type Copy = { en: string; th: string };
export const copy = (en: string, th: string): Copy => ({ en, th });
export type PartId =
	| 'navigation'
	| 'search'
	| 'discovery'
	| 'filters'
	| 'cards'
	| 'compare'
	| 'detail'
	| 'proof'
	| 'offers'
	| 'basket'
	| 'service'
	| 'personalization';
export type Block =
	| 'search'
	| 'categories'
	| 'scope'
	| 'preferences'
	| 'products'
	| 'photos'
	| 'specs'
	| 'price'
	| 'source'
	| 'question'
	| 'saved'
	| 'budget'
	| 'voucher'
	| 'shipping'
	| 'payment'
	| 'orders'
	| 'review'
	| 'apply'
	| 'undo';
export type Arrangement = 'stack' | 'split' | 'tiles' | 'rail' | 'receipt' | 'focus';
export type Recipe = {
	id: string;
	title: Copy;
	blocks: Block[];
	arrangement: Arrangement;
	need: Copy;
	trigger: Copy;
};
export type Part = { id: PartId; title: Copy; purpose: Copy; dependency: Copy; recipes: Recipe[] };

// Twelve shopper situations, applied to a fixed part library rather than inferred identities.
const situations: [Copy, Copy][] = [
	[
		copy('Start with a familiar shop', 'เริ่มจากหน้าร้านที่คุ้นเคย'),
		copy('First visit; no preference selected', 'เข้าร้านครั้งแรก ยังไม่ได้เลือกความชอบ')
	],
	[
		copy('Find and decide quickly', 'หาและตัดสินใจให้เร็ว'),
		copy('Shopper chooses a compact view', 'ผู้ใช้เลือกมุมมองกระชับ')
	],
	[
		copy('Recognize products by their pictures', 'จำและเลือกสินค้าจากภาพ'),
		copy('Shopper explicitly chooses pictures first', 'ผู้ใช้เลือกดูรูปก่อน')
	],
	[
		copy('Read comfortably', 'อ่านได้สบายตา'),
		copy('Shopper turns on large print', 'ผู้ใช้เปิดตัวอักษรใหญ่')
	],
	[
		copy('Stay within the stated budget', 'เลือกให้พอดีกับงบที่ตั้งไว้'),
		copy('Shopper enters a price ceiling', 'ผู้ใช้กำหนดเพดานราคา')
	],
	[
		copy('Examine the details before choosing', 'ดูรายละเอียดก่อนตัดสินใจ'),
		copy('Shopper asks to compare listing facts', 'ผู้ใช้ขอเทียบข้อมูลจากรายการ')
	],
	[
		copy('Understand unfamiliar choices', 'เข้าใจตัวเลือกที่ยังไม่คุ้น'),
		copy('Shopper asks for help choosing', 'ผู้ใช้ขอความช่วยเหลือในการเลือก')
	],
	[
		copy('Make a choice together', 'ช่วยกันเลือกของ'),
		copy('Shopper says they are buying for someone', 'ผู้ใช้บอกว่ากำลังซื้อให้คนอื่น')
	],
	[
		copy('Complete a specific household task', 'เลือกของสำหรับงานบ้านที่ต้องทำ'),
		copy('Shopper selects laundry or kitchen care', 'ผู้ใช้เลือกงานซักผ้าหรือดูแลครัว')
	],
	[
		copy('Concentrate on the current decision', 'โฟกัสการตัดสินใจตรงหน้า'),
		copy('Shopper chooses fewer distractions', 'ผู้ใช้เลือกมุมมองลดสิ่งรบกวน')
	],
	[
		copy('Return to a shortlist', 'กลับมาดูของที่คัดไว้'),
		copy('Shopper opens saved products', 'ผู้ใช้เปิดรายการที่บันทึกไว้')
	],
	[
		copy('Check the evidence before acting', 'ตรวจที่มาของข้อมูลก่อนเลือก'),
		copy('Shopper opens source information', 'ผู้ใช้เปิดดูแหล่งอ้างอิง')
	]
];

type VariantSeed = [string, string, Arrangement, ...Block[]];
function part(
	id: PartId,
	title: Copy,
	purpose: Copy,
	dependency: Copy,
	seeds: VariantSeed[]
): Part {
	return {
		id,
		title,
		purpose,
		dependency,
		recipes: seeds.map(([en, th, arrangement, ...blocks], index) => ({
			id: `${id}-${String(index + 1).padStart(2, '0')}`,
			title: copy(en, th),
			arrangement,
			blocks,
			need: situations[index][0],
			trigger: situations[index][1]
		}))
	};
}
const local = copy(
	'Uses the loaded catalog and direct shopper choices.',
	'ใช้ข้อมูลสินค้าที่โหลดแล้วและตัวเลือกที่ผู้ใช้กำหนดเอง'
);
const listing = copy(
	'Only saved names, photographs, sizes and observed prices are available. Confirm current terms at the original listing.',
	'มีชื่อ ภาพ ขนาด และราคาอ้างอิงที่บันทึกไว้ ตรวจสอบเงื่อนไขปัจจุบันจากรายการต้นทาง'
);
const checkout = copy(
	'Requires live voucher, shipping, stock and checkout services. This is a design preview; transaction actions are unavailable.',
	'ต้องมีระบบโค้ด ค่าจัดส่ง สต็อก และชำระเงินจริง ส่วนนี้เป็นแบบออกแบบ ยังทำธุรกรรมไม่ได้'
);
export const parts: Part[] = [
	part(
		'navigation',
		copy('Header & navigation', 'ส่วนหัวและเมนู'),
		copy('Keep a recognizable route into the shop.', 'ให้ผู้ใช้เข้าถึงส่วนต่าง ๆ ของร้านได้อย่างคุ้นเคย'),
		local,
		[
			['Marketplace header', 'หัวเว็บหน้าร้าน', 'stack', 'scope', 'search', 'categories'],
			['Compact search bar', 'แถบค้นหากระชับ', 'rail', 'search', 'saved'],
			['Category tiles', 'หมวดหมู่แบบภาพ', 'tiles', 'categories', 'photos'],
			['Readable navigation', 'เมนูอ่านง่าย', 'stack', 'scope', 'categories', 'preferences'],
			['Budget navigation', 'เมนูพร้อมตัวกรองงบ', 'split', 'search', 'budget', 'categories'],
			['Comparison shortcut', 'ทางลัดไปเปรียบเทียบ', 'rail', 'search', 'specs'],
			['Guided entry', 'เมนูช่วยเริ่มเลือก', 'split', 'categories', 'question'],
			['Shared shortlist entry', 'เมนูรายการที่ช่วยกันเลือก', 'stack', 'scope', 'saved', 'question'],
			['Task navigation', 'เมนูตามงานบ้าน', 'tiles', 'categories', 'search', 'products'],
			['Focused header', 'หัวเว็บโฟกัสสินค้า', 'focus', 'search', 'scope'],
			['Saved-first navigation', 'เปิดด้วยรายการที่บันทึก', 'split', 'saved', 'categories'],
			['Source-aware header', 'หัวเว็บพร้อมแหล่งที่มา', 'receipt', 'scope', 'source', 'search']
		]
	),
	part(
		'search',
		copy('Search', 'การค้นหา'),
		copy('Turn a need into an understandable query.', 'เปลี่ยนความต้องการเป็นคำค้นที่เข้าใจได้'),
		local,
		[
			['Search in this shop', 'ค้นหาในร้าน', 'stack', 'search', 'scope'],
			['Quick product search', 'ค้นหาสินค้าเร็ว', 'rail', 'search', 'products'],
			['Picture-led results', 'ผลค้นหาเน้นภาพ', 'tiles', 'search', 'photos'],
			['Large search', 'ช่องค้นหาอ่านง่าย', 'stack', 'scope', 'search', 'products'],
			['Search within budget', 'ค้นหาภายในงบ', 'split', 'search', 'budget'],
			['Find by listing detail', 'หาจากรายละเอียดสินค้า', 'split', 'search', 'specs'],
			['Describe the task', 'บอกงานที่ต้องใช้', 'focus', 'question', 'search', 'categories'],
			['Search for someone', 'ค้นหาให้คนอื่น', 'stack', 'question', 'search', 'saved'],
			['Category-scoped search', 'ค้นหาแยกหมวด', 'rail', 'categories', 'search'],
			['Single-query focus', 'โฟกัสคำค้นเดียว', 'focus', 'search'],
			['Search saved items', 'ค้นหาในรายการที่บันทึก', 'stack', 'saved', 'search'],
			['Traceable result', 'ผลค้นหาที่ตรวจที่มาได้', 'receipt', 'search', 'source', 'products']
		]
	),
	part(
		'discovery',
		copy('Home & discovery', 'หน้าแรกและการค้นพบ'),
		copy(
			'Offer a useful next direction without hiding the catalog.',
			'เสนอทางเลือกที่เกี่ยวข้องและยังเข้าถึงสินค้าทั้งหมดได้'
		),
		listing,
		[
			['Shop departments', 'หมวดสินค้าหน้าร้าน', 'stack', 'categories', 'products'],
			['Direct to shelf', 'ตรงไปที่สินค้า', 'focus', 'products'],
			['Photo collection', 'คอลเลกชันภาพสินค้า', 'tiles', 'photos', 'categories'],
			['Comfortable browsing', 'เลือกซื้อแบบอ่านง่าย', 'stack', 'categories', 'products', 'source'],
			['Budget discovery', 'ค้นพบของในงบ', 'split', 'budget', 'products'],
			['Compare on entry', 'เริ่มด้วยการเปรียบเทียบ', 'stack', 'specs', 'products'],
			['Choose by use', 'เลือกจากการใช้งาน', 'split', 'question', 'categories', 'products'],
			['Shortlist together', 'คัดรายการด้วยกัน', 'rail', 'saved', 'products'],
			['Household task shelf', 'ชั้นสินค้าตามงานบ้าน', 'tiles', 'categories', 'products', 'photos'],
			['Quiet discovery', 'ค้นพบแบบเรียบง่าย', 'focus', 'products', 'categories'],
			['Continue choosing', 'กลับมาเลือกต่อ', 'stack', 'saved', 'products', 'categories'],
			['Source collection', 'รวมสินค้าพร้อมที่มา', 'receipt', 'source', 'categories', 'products']
		]
	),
	part(
		'filters',
		copy('Filters & sorting', 'ตัวกรองและการเรียง'),
		copy('Keep each constraint visible and reversible.', 'แสดงข้อจำกัดที่เลือกและแก้กลับได้เสมอ'),
		local,
		[
			['Shop sidebar', 'แถบกรองข้างร้าน', 'stack', 'categories', 'budget', 'undo'],
			['Compact filter rail', 'แถบกรองกระชับ', 'rail', 'categories', 'budget'],
			['Visual category filter', 'กรองหมวดจากภาพ', 'tiles', 'photos', 'categories', 'undo'],
			['Large filter controls', 'ตัวกรองปุ่มใหญ่', 'stack', 'budget', 'categories', 'undo'],
			['Price ceiling first', 'ตั้งงบก่อนเลือก', 'focus', 'budget', 'products'],
			['Detail filter panel', 'ตัวกรองคู่รายละเอียด', 'split', 'categories', 'specs', 'budget'],
			['Guided filtering', 'แนะนำวิธีกรอง', 'stack', 'question', 'categories', 'budget'],
			['Shortlist constraints', 'ตัวกรองสำหรับรายการที่คัดไว้', 'split', 'saved', 'budget'],
			['Filter by chore', 'กรองตามงานบ้าน', 'focus', 'categories', 'products'],
			['One constraint', 'ตั้งเงื่อนไขเดียว', 'focus', 'budget', 'undo'],
			['Saved-item filter', 'กรองของที่บันทึก', 'rail', 'saved', 'categories', 'undo'],
			['Filter explanation', 'อธิบายเงื่อนไขที่ใช้', 'receipt', 'budget', 'source', 'undo']
		]
	),
	part(
		'cards',
		copy('Product cards', 'การ์ดสินค้า'),
		copy(
			'Change the information hierarchy for the shopper’s task.',
			'เปลี่ยนลำดับความสำคัญของข้อมูลตามงานที่ผู้ใช้ทำ'
		),
		listing,
		[
			['Marketplace card', 'การ์ดหน้าร้านมาตรฐาน', 'stack', 'photos', 'products', 'price'],
			['Compact product row', 'แถวสินค้ากระชับ', 'rail', 'products', 'price'],
			['Picture-first card', 'การ์ดภาพนำ', 'focus', 'photos', 'price', 'products'],
			['Large-print card', 'การ์ดตัวอักษรใหญ่', 'stack', 'products', 'price', 'specs'],
			['Price-first card', 'การ์ดราคานำ', 'receipt', 'price', 'products', 'photos'],
			['Specification card', 'การ์ดรายละเอียดนำ', 'split', 'specs', 'products', 'price'],
			['Explain the listing', 'การ์ดช่วยอ่านรายการ', 'stack', 'products', 'question', 'specs'],
			['Family shortlist card', 'การ์ดรายการสำหรับครอบครัว', 'split', 'products', 'saved', 'source'],
			['Use-case card', 'การ์ดตามการใช้งาน', 'tiles', 'categories', 'products', 'specs'],
			['Quiet product card', 'การ์ดสินค้าเรียบง่าย', 'focus', 'products', 'price'],
			['Saved product card', 'การ์ดสินค้าที่บันทึก', 'rail', 'saved', 'products', 'price'],
			['Source-first card', 'การ์ดแหล่งข้อมูลนำ', 'receipt', 'source', 'products', 'price']
		]
	),
	part(
		'compare',
		copy('Comparison', 'การเปรียบเทียบ'),
		copy(
			'Compare like-for-like facts and disclose missing data.',
			'เทียบข้อมูลชนิดเดียวกันและบอกข้อมูลที่ยังไม่มี'
		),
		listing,
		[
			['Product comparison', 'ตารางเทียบสินค้า', 'stack', 'photos', 'specs', 'price'],
			['Quick comparison', 'เทียบแบบย่อ', 'rail', 'specs', 'price'],
			['Visual comparison', 'เทียบจากภาพ', 'tiles', 'photos', 'specs'],
			['Readable comparison', 'เทียบแบบอ่านง่าย', 'stack', 'products', 'specs', 'source'],
			['Price comparison', 'เทียบราคาอ้างอิง', 'receipt', 'price', 'specs', 'source'],
			['Specs lead', 'ข้อมูลจำเพาะนำ', 'split', 'specs', 'price', 'photos'],
			['Choosing guide', 'คู่มือช่วยเทียบ', 'stack', 'question', 'specs', 'categories'],
			['Shareable shortlist', 'รายการสำหรับช่วยกันเทียบ', 'split', 'saved', 'specs', 'source'],
			['Compare by use', 'เทียบตามการใช้งาน', 'tiles', 'categories', 'specs', 'price'],
			['Focused fact row', 'โฟกัสข้อมูลที่ต้องการ', 'focus', 'specs', 'source'],
			['Compare saved products', 'เทียบของที่บันทึก', 'stack', 'saved', 'specs', 'price'],
			['Evidence beside facts', 'ที่มาข้างข้อมูล', 'receipt', 'specs', 'source', 'price']
		]
	),
	part(
		'detail',
		copy('Product details', 'รายละเอียดสินค้า'),
		copy(
			'Give each listing a clear path from evidence to action.',
			'อ่านข้อมูล ตรวจที่มา แล้วเลือกการกระทำได้ชัดเจน'
		),
		listing,
		[
			[
				'Marketplace detail',
				'รายละเอียดแบบหน้าร้าน',
				'split',
				'photos',
				'products',
				'price',
				'source'
			],
			['Quick-view sheet', 'แผงดูสินค้าเร็ว', 'rail', 'products', 'price', 'source'],
			['Gallery-led detail', 'รายละเอียดภาพนำ', 'focus', 'photos', 'products', 'specs'],
			['Comfort detail', 'รายละเอียดอ่านง่าย', 'stack', 'products', 'specs', 'price', 'source'],
			['Cost-first detail', 'รายละเอียดราคานำ', 'receipt', 'price', 'shipping', 'products'],
			['Specification workspace', 'พื้นที่อ่านสเปก', 'split', 'specs', 'photos', 'source'],
			['Assisted detail', 'รายละเอียดพร้อมตัวช่วย', 'stack', 'products', 'question', 'source'],
			['Decision for someone', 'รายละเอียดสำหรับเลือกให้คนอื่น', 'split', 'products', 'saved', 'specs'],
			['Task-fit detail', 'รายละเอียดตามงานที่ใช้', 'tiles', 'categories', 'specs', 'products'],
			['Focus on one listing', 'โฟกัสสินค้ารายการเดียว', 'focus', 'products', 'price', 'source'],
			['Return to a listing', 'กลับมาดูสินค้าที่คัดไว้', 'stack', 'saved', 'products', 'price'],
			['Provenance detail', 'รายละเอียดพร้อมหลักฐาน', 'receipt', 'source', 'specs', 'price']
		]
	),
	part(
		'proof',
		copy('Trust & evidence', 'ความเชื่อมั่นและหลักฐาน'),
		copy('Make the source visible before asking for trust.', 'แสดงที่มาของข้อมูลให้ตรวจสอบได้'),
		listing,
		[
			['Listing source slip', 'ใบที่มาของรายการ', 'receipt', 'source', 'products'],
			['Inline evidence', 'ที่มาแบบกระชับ', 'rail', 'source', 'price'],
			['Image provenance', 'ที่มาของภาพสินค้า', 'split', 'photos', 'source'],
			['Readable evidence', 'หลักฐานอ่านง่าย', 'stack', 'source', 'specs'],
			['Price provenance', 'ที่มาของราคา', 'receipt', 'price', 'source'],
			['Spec provenance', 'ที่มาของรายละเอียด', 'split', 'specs', 'source', 'products'],
			['Cite or decline', 'อ้างอิงหรือบอกว่ายืนยันไม่ได้', 'stack', 'question', 'source', 'review'],
			['Evidence to share', 'หลักฐานสำหรับช่วยกันเลือก', 'tiles', 'saved', 'source'],
			['Category evidence', 'ข้อมูลการใช้งานจากรายการ', 'stack', 'categories', 'source'],
			['Single-source focus', 'โฟกัสแหล่งอ้างอิง', 'focus', 'source'],
			['Recheck a shortlist', 'ตรวจที่มารายการที่บันทึก', 'receipt', 'saved', 'source', 'specs'],
			['Known and unknown', 'ข้อมูลที่มีและยังไม่มี', 'split', 'source', 'review', 'shipping']
		]
	),
	part(
		'offers',
		copy('Vouchers & deals', 'โค้ดและดีล'),
		copy(
			'Explain eligibility and the payable total before adding items.',
			'อธิบายสิทธิ์และยอดที่ต้องจ่ายก่อนเพิ่มสินค้า'
		),
		checkout,
		[
			['Voucher shelf', 'ชั้นโค้ดส่วนลด', 'tiles', 'voucher', 'source'],
			['Compact eligibility', 'เงื่อนไขแบบย่อ', 'rail', 'voucher', 'price'],
			['Product-linked offer', 'ข้อเสนอคู่สินค้า', 'split', 'photos', 'voucher'],
			['Readable deal receipt', 'ใบดีลอ่านง่าย', 'stack', 'price', 'voucher', 'shipping'],
			['Budget-aware offer', 'ข้อเสนอภายในงบ', 'receipt', 'budget', 'voucher', 'price'],
			['Compare deal terms', 'เทียบเงื่อนไขดีล', 'split', 'voucher', 'shipping', 'source'],
			['Why a code does not apply', 'ทำไมใช้โค้ดไม่ได้', 'stack', 'question', 'voucher', 'source'],
			['Check gift delivery', 'ตรวจส่งของขวัญ', 'split', 'shipping', 'voucher'],
			['Task basket offer', 'ข้อเสนอสำหรับชุดงาน', 'tiles', 'categories', 'voucher', 'price'],
			['One deal to inspect', 'ตรวจดีลทีละรายการ', 'focus', 'voucher', 'source'],
			['Saved-item eligibility', 'สิทธิ์ของสินค้าที่บันทึก', 'stack', 'saved', 'voucher', 'shipping'],
			[
				'Complete deal proof',
				'ใบตรวจดีลครบเงื่อนไข',
				'receipt',
				'source',
				'voucher',
				'price',
				'shipping'
			]
		]
	),
	part(
		'basket',
		copy('Basket & checkout', 'ตะกร้าและชำระเงิน'),
		copy(
			'Keep selection, extra costs and commitment explicit.',
			'แยกรายการที่เลือก ค่าใช้จ่าย และการยืนยันให้ชัด'
		),
		checkout,
		[
			['Seller-grouped basket', 'ตะกร้าแยกร้าน', 'stack', 'scope', 'products', 'shipping', 'payment'],
			['Compact order review', 'ตรวจรายการแบบย่อ', 'rail', 'products', 'payment'],
			['Visual basket', 'ตะกร้าภาพสินค้า', 'tiles', 'photos', 'products', 'payment'],
			[
				'Readable order review',
				'ตรวจรายการแบบอ่านง่าย',
				'stack',
				'products',
				'price',
				'shipping',
				'payment'
			],
			['Budget guard', 'ตรวจงบก่อนจ่าย', 'receipt', 'budget', 'products', 'payment'],
			['Variant verification', 'ตรวจตัวเลือกสินค้า', 'split', 'specs', 'products', 'payment'],
			['Guided checkout', 'ช่วยตรวจทีละขั้น', 'stack', 'question', 'shipping', 'payment'],
			['Recipient-first review', 'ตรวจผู้รับก่อนส่ง', 'split', 'shipping', 'products', 'payment'],
			['Task-set basket', 'ตะกร้าชุดงาน', 'tiles', 'categories', 'products', 'payment'],
			['Focused confirmation', 'โฟกัสการยืนยัน', 'focus', 'price', 'shipping', 'payment'],
			['Saved set to basket', 'จากรายการบันทึกสู่ตะกร้า', 'stack', 'saved', 'specs', 'payment'],
			[
				'Checkout evidence',
				'หลักฐานก่อนชำระเงิน',
				'receipt',
				'source',
				'voucher',
				'shipping',
				'payment'
			]
		]
	),
	part(
		'service',
		copy('After purchase & account', 'หลังซื้อและบัญชี'),
		copy(
			'Help the shopper use, maintain and manage what they chose.',
			'ช่วยใช้ ดูแล และจัดการสินค้าที่เลือก'
		),
		copy(
			'Requires an authenticated account, orders, returns and notification services. No account data is invented.',
			'ต้องเชื่อมบัญชี คำสั่งซื้อ การคืนสินค้า และการแจ้งเตือน โดยไม่สร้างข้อมูลบัญชีสมมติ'
		),
		[
			['Orders overview', 'ภาพรวมคำสั่งซื้อ', 'stack', 'orders', 'source'],
			['Quick order status', 'สถานะคำสั่งซื้อแบบย่อ', 'rail', 'orders'],
			['Visual purchase history', 'ประวัติซื้อแบบภาพ', 'tiles', 'orders', 'photos'],
			['Readable account', 'หน้าบัญชีอ่านง่าย', 'stack', 'orders', 'preferences'],
			['Spending review', 'ทบทวนค่าใช้จ่าย', 'receipt', 'orders', 'payment'],
			['Product reference archive', 'เก็บข้อมูลสินค้าที่ใช้', 'split', 'orders', 'specs', 'source'],
			['Help with an order', 'ช่วยเรื่องคำสั่งซื้อ', 'stack', 'question', 'orders', 'source'],
			['Family delivery overview', 'ติดตามของที่ส่งให้ครอบครัว', 'split', 'orders', 'shipping'],
			['Restock planning', 'วางแผนเติมของใช้', 'tiles', 'saved', 'orders', 'categories'],
			['One order focus', 'โฟกัสคำสั่งซื้อเดียว', 'focus', 'orders', 'source'],
			['Saved shopping sets', 'ชุดสินค้าที่บันทึก', 'stack', 'saved', 'orders', 'preferences'],
			['Returns and evidence', 'คืนสินค้าและข้อมูลอ้างอิง', 'receipt', 'orders', 'source', 'question']
		]
	),
	part(
		'personalization',
		copy('Preferences & assistant', 'ความชอบและผู้ช่วย'),
		copy(
			'Preview the proposed view, apply once, and refine with chat.',
			'ดูมุมมองที่เสนอ ใช้ครั้งเดียว แล้วแชตปรับต่อ'
		),
		local,
		[
			['Optional interview entry', 'ทางเข้าคำถามแบบสมัครใจ', 'rail', 'preferences', 'question'],
			['Quick view control', 'เปลี่ยนมุมมองเร็ว', 'rail', 'preferences', 'undo'],
			['Visual view chooser', 'เลือกมุมมองจากภาพ', 'tiles', 'photos', 'preferences', 'apply'],
			['Large-print controls', 'ตั้งค่าการอ่าน', 'stack', 'preferences', 'apply', 'undo'],
			['Budget and preferences', 'งบและความชอบ', 'split', 'budget', 'preferences', 'apply'],
			['Evidence preference', 'เลือกข้อมูลที่ช่วยตัดสินใจ', 'split', 'specs', 'preferences', 'apply'],
			['Step-by-step interview', 'คำถามทีละขั้น', 'focus', 'question', 'preferences', 'apply'],
			['Choose for someone', 'ตั้งค่าสำหรับเลือกให้คนอื่น', 'stack', 'question', 'saved', 'preferences'],
			['This-visit context', 'บริบทสำหรับครั้งนี้', 'tiles', 'categories', 'preferences', 'apply'],
			['Chat refinement', 'แชตปรับต่อ', 'focus', 'question', 'undo'],
			['Return to preferences', 'กลับมาปรับความชอบ', 'stack', 'saved', 'preferences', 'undo'],
			['What changed receipt', 'ใบสรุปสิ่งที่เปลี่ยน', 'receipt', 'preferences', 'apply', 'undo', 'source']
		]
	)
];

export const dependencies = new Set<Block>(['voucher', 'shipping', 'payment', 'orders', 'review']);
export const blockNames: Record<Block, Copy> = {
	search: copy('Shop search', 'ค้นหาในร้าน'),
	categories: copy('Product groups', 'กลุ่มสินค้า'),
	scope: copy('Shop identity', 'ข้อมูลร้าน'),
	preferences: copy('Reading preferences', 'ความชอบในการอ่าน'),
	products: copy('Listing information', 'ข้อมูลสินค้า'),
	photos: copy('Original photographs', 'ภาพสินค้าต้นฉบับ'),
	specs: copy('Listed size and options', 'ขนาดและตัวเลือกจากรายการ'),
	price: copy('Observed listing price', 'ราคาอ้างอิงจากรายการ'),
	source: copy('Source and observation date', 'ที่มาและวันที่บันทึก'),
	question: copy('Choosing assistance', 'ตัวช่วยในการเลือก'),
	saved: copy('Saved selection', 'รายการที่บันทึก'),
	budget: copy('Price ceiling', 'เพดานราคา'),
	voucher: copy('Voucher eligibility', 'สิทธิ์ใช้โค้ด'),
	shipping: copy('Delivery terms', 'เงื่อนไขการจัดส่ง'),
	payment: copy('Payment confirmation', 'ยืนยันการชำระเงิน'),
	orders: copy('Order service', 'บริการคำสั่งซื้อ'),
	review: copy('Buyer reviews', 'รีวิวผู้ซื้อ'),
	apply: copy('Review and Apply', 'ตรวจแล้วใช้มุมมอง'),
	undo: copy('Undo and Reset', 'ย้อนกลับและคืนค่า')
};
