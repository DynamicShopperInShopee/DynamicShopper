/** Exact authored module inventory. Availability describes supported design data, not a completed feature. */
export type Copy = { en: string; th: string };
export const copy = (en: string, th: string): Copy => ({ en, th });
export type PartId =
	| 'global-shell'
	| 'intent-onboarding'
	| 'adaptive-homepage'
	| 'search-discovery'
	| 'results-listing'
	| 'product-detail'
	| 'trust-proof'
	| 'live-video-social'
	| 'smart-basket'
	| 'checkout-payment'
	| 'post-purchase'
	| 'account-safety';
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
export type Availability = 'ready' | 'service';
export type Recipe = {
	id: string;
	title: Copy;
	blocks: Block[];
	arrangement: Arrangement;
	need: Copy;
	trigger: Copy;
	availability: Availability;
	dependency: Copy;
};
export type Part = { id: PartId; title: Copy; purpose: Copy; dependency: Copy; recipes: Recipe[] };

function moduleRecipe(
	id: string,
	title: Copy,
	availability: Availability,
	arrangement: Arrangement,
	blocks: Block[],
	need: Copy,
	source: Copy
): Recipe {
	return {
		id,
		title,
		availability,
		arrangement,
		blocks,
		need,
		trigger: copy(
			`Shopper opens “${title.en}” for the current task.`,
			`ผู้ใช้เปิด “${title.th}” สำหรับงานที่กำลังทำ`
		),
		dependency:
			availability === 'ready'
				? copy(
						`Design uses ${source.en}. Catalog-backed content uses shared catalog fixtures until updated data arrives.`,
						`แบบออกแบบใช้${source.th} เนื้อหาจากแค็ตตาล็อกใช้ข้อมูลตัวอย่างร่วมกันระหว่างรอข้อมูลฉบับใหม่`
					)
				: copy(
						`Unavailable: requires ${source.en}. Catalog-backed previews use shared catalog fixtures until updated data arrives.`,
						`ยังไม่พร้อมใช้งาน ต้องมี${source.th} ตัวอย่างที่อ้างแค็ตตาล็อกใช้ข้อมูลตัวอย่างร่วมกันระหว่างรอข้อมูลฉบับใหม่`
					)
	};
}

export const parts: Part[] = [
	{
		id: 'global-shell',
		title: copy('Global shell', 'โครงหลักของเว็บ'),
		purpose: copy(
			'Keep navigation and direct shopper controls predictable.',
			'ให้เมนูและตัวควบคุมที่ผู้ใช้เลือกทำงานอย่างคุ้นเคย'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'global-shell-01',
				copy('Home/navigation', 'หน้าแรกและเมนู'),
				'ready',
				'rail',
				['scope', 'categories'],
				copy('Keep a familiar route back to the store.', 'กลับหน้าร้านได้ด้วยเส้นทางที่คุ้นเคย'),
				copy('existing root/category navigation', 'เมนูหน้าร้านและหมวดสินค้าที่มีอยู่')
			),
			moduleRecipe(
				'global-shell-02',
				copy('Universal search', 'ค้นหาทั่วแค็ตตาล็อก'),
				'ready',
				'focus',
				['search', 'products'],
				copy('Find products without knowing their category.', 'หาสินค้าได้แม้ยังไม่รู้หมวด'),
				copy(
					'existing query controls and canonical fixture search',
					'ช่องค้นหาเดิมและการค้นในแค็ตตาล็อกตัวอย่าง'
				)
			),
			moduleRecipe(
				'global-shell-03',
				copy('Category navigator', 'เมนูหมวดสินค้า'),
				'ready',
				'tiles',
				['categories', 'products'],
				copy('Narrow browsing to an explicit category.', 'จำกัดการเลือกดูตามหมวดที่เลือกเอง'),
				copy(
					'canonical category names and explicit category selection',
					'ชื่อหมวดจากแค็ตตาล็อกและการเลือกหมวดโดยผู้ใช้'
				)
			),
			moduleRecipe(
				'global-shell-04',
				copy('Shopping-goal switcher', 'สลับเป้าหมายการเลือกซื้อ'),
				'ready',
				'split',
				['preferences', 'question', 'apply'],
				copy(
					'Choose a presentation suited to the current shopping task.',
					'เลือกการแสดงผลให้เหมาะกับงานซื้อครั้งนี้'
				),
				copy(
					'the existing optional interview and authored presentation choices',
					'คำถามแบบสมัครใจและตัวเลือกการแสดงผลที่มีอยู่'
				)
			),
			moduleRecipe(
				'global-shell-05',
				copy('Active preference chips', 'ชิปความชอบที่ใช้อยู่'),
				'ready',
				'rail',
				['preferences', 'undo'],
				copy(
					'See and remove an explicit presentation preference.',
					'ดูและลบความชอบการแสดงผลที่เลือกไว้'
				),
				copy(
					'the current plan, explicit preference locks and Undo',
					'แผนปัจจุบัน การล็อกความชอบที่เลือก และการย้อนกลับ'
				)
			),
			moduleRecipe(
				'global-shell-06',
				copy('Active moment chips', 'ชิปบริบทช่วงเวลาที่ใช้อยู่'),
				'service',
				'rail',
				['preferences', 'scope', 'undo'],
				copy('See which declared moment shapes recommendations.', 'เห็นว่าบริบทที่ระบุใดมีผลต่อคำแนะนำ'),
				copy(
					'explicit moment state and supported moment-to-product mappings',
					'สถานะบริบทที่ผู้ใช้ระบุและข้อมูลจับคู่บริบทกับสินค้า'
				)
			),
			moduleRecipe(
				'global-shell-07',
				copy('Wishlist', 'รายการที่อยากได้'),
				'service',
				'stack',
				['saved', 'products'],
				copy('Keep products for a later buying decision.', 'เก็บสินค้าไว้ตัดสินใจซื้อภายหลัง'),
				copy('a wishlist store and save/remove controls', 'ที่เก็บรายการโปรดและปุ่มบันทึกหรือลบ')
			),
			moduleRecipe(
				'global-shell-08',
				copy('Compare tray', 'ถาดเปรียบเทียบ'),
				'service',
				'rail',
				['saved', 'specs', 'products'],
				copy(
					'Keep personally selected products together for comparison.',
					'รวมสินค้าที่เลือกเองไว้เปรียบเทียบ'
				),
				copy(
					'persistent product-comparison selection and tray controls',
					'สถานะสินค้าที่เลือกเทียบและตัวควบคุมถาดเปรียบเทียบ'
				)
			),
			moduleRecipe(
				'global-shell-09',
				copy('Cart', 'ตะกร้า'),
				'ready',
				'stack',
				['products', 'price', 'shipping'],
				copy(
					'Review locally selected products and quantities.',
					'ตรวจสินค้าที่เลือกและจำนวนในตะกร้าเครื่องนี้'
				),
				copy(
					'the shared local cart and canonical product/shop IDs',
					'ตะกร้าในเครื่องร่วมกันและรหัสสินค้าและร้านจากแค็ตตาล็อก'
				)
			),
			moduleRecipe(
				'global-shell-10',
				copy('Order tracker', 'ติดตามคำสั่งซื้อ'),
				'service',
				'stack',
				['orders', 'shipping'],
				copy('Locate an actual order after purchase.', 'ตรวจตำแหน่งคำสั่งซื้อจริงหลังซื้อ'),
				copy(
					'an authenticated order service and real order status',
					'บริการคำสั่งซื้อที่ยืนยันบัญชีและสถานะคำสั่งซื้อจริง'
				)
			),
			moduleRecipe(
				'global-shell-11',
				copy('Language and accessibility', 'ภาษาและการเข้าถึง'),
				'ready',
				'rail',
				['preferences', 'apply'],
				copy('Choose language and comfortable reading controls.', 'เลือกภาษาและตัวควบคุมการอ่านที่สะดวก'),
				copy(
					'existing language/theme controls and reduced-motion styles',
					'ตัวควบคุมภาษาและธีมเดิมพร้อมรูปแบบลดการเคลื่อนไหว'
				)
			),
			moduleRecipe(
				'global-shell-12',
				copy('“What changed,” Undo, and Reset', 'สิ่งที่เปลี่ยน ย้อนกลับ และคืนค่า'),
				'ready',
				'receipt',
				['preferences', 'undo', 'source'],
				copy('Understand a view change and reverse it.', 'เข้าใจการเปลี่ยนมุมมองและย้อนกลับได้'),
				copy(
					'existing plan differences and atomic Undo/Reset',
					'การเปรียบเทียบแผนและการย้อนกลับหรือคืนค่าแบบครั้งเดียว'
				)
			)
		]
	},
	{
		id: 'intent-onboarding',
		title: copy('Intent and onboarding', 'ความตั้งใจและการเริ่มใช้งาน'),
		purpose: copy(
			'Let shoppers declare the current task without requiring personalization.',
			'ให้ผู้ใช้ระบุงานครั้งนี้โดยไม่บังคับปรับเฉพาะบุคคล'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'intent-onboarding-01',
				copy('“What are you shopping for?” entry', 'ทางเข้าคำถามว่ากำลังเลือกซื้ออะไร'),
				'ready',
				'focus',
				['question', 'preferences', 'apply'],
				copy('State a shopping goal before choosing a view.', 'บอกเป้าหมายการซื้อก่อนเลือกมุมมอง'),
				copy(
					'the existing optional interview and authored presentation choices',
					'คำถามแบบสมัครใจและตัวเลือกการแสดงผลที่มีอยู่'
				)
			),
			moduleRecipe(
				'intent-onboarding-02',
				copy('Browse without personalizing', 'เลือกดูโดยไม่ปรับเฉพาะบุคคล'),
				'ready',
				'focus',
				['products', 'categories'],
				copy('Browse products without answering the interview.', 'ดูสินค้าได้โดยไม่ต้องตอบคำถาม'),
				copy('existing root/category navigation', 'เมนูหน้าร้านและหมวดสินค้าที่มีอยู่')
			),
			moduleRecipe(
				'intent-onboarding-03',
				copy('Quick preference picker', 'เลือกความชอบแบบเร็ว'),
				'ready',
				'tiles',
				['preferences', 'apply', 'undo'],
				copy(
					'Choose an authored view without a long interview.',
					'เลือกมุมมองที่เตรียมไว้โดยไม่ต้องตอบนาน'
				),
				copy(
					'the current plan, explicit preference locks and Undo',
					'แผนปัจจุบัน การล็อกความชอบที่เลือก และการย้อนกลับ'
				)
			),
			moduleRecipe(
				'intent-onboarding-04',
				copy('Budget selector', 'ตัวเลือกงบประมาณ'),
				'ready',
				'split',
				['budget', 'products'],
				copy('Set a personal ceiling for catalog prices.', 'ตั้งเพดานราคาสินค้าจากแค็ตตาล็อกด้วยตนเอง'),
				copy("the shopper's explicit catalog price ceiling", 'เพดานราคาสินค้าที่ผู้ใช้กำหนดเอง')
			),
			moduleRecipe(
				'intent-onboarding-05',
				copy('Information-style selector', 'ตัวเลือกรูปแบบข้อมูล'),
				'ready',
				'tiles',
				['photos', 'specs', 'preferences'],
				copy(
					'Choose pictures, specifications or summaries for reading.',
					'เลือกอ่านจากภาพ สเปก หรือสรุป'
				),
				copy(
					'existing theme, layout and detail-field controls',
					'ตัวควบคุมธีม รูปแบบ และช่องรายละเอียดที่มีอยู่'
				)
			),
			moduleRecipe(
				'intent-onboarding-06',
				copy('Buying-for-myself/another-person', 'ซื้อให้ตนเองหรือให้ผู้อื่น'),
				'ready',
				'split',
				['question', 'preferences', 'apply'],
				copy(
					'Choose an existing gift or family reading presentation.',
					'เลือกการแสดงผลสำหรับของขวัญหรือครอบครัวที่มีอยู่'
				),
				copy(
					'the existing optional interview and authored presentation choices',
					'คำถามแบบสมัครใจและตัวเลือกการแสดงผลที่มีอยู่'
				)
			),
			moduleRecipe(
				'intent-onboarding-07',
				copy('Occasion selector', 'ตัวเลือกโอกาส'),
				'service',
				'tiles',
				['question', 'categories', 'preferences'],
				copy(
					'Describe the occasion without inferred personal identity.',
					'บอกโอกาสที่ซื้อโดยไม่เดาตัวตนส่วนบุคคล'
				),
				copy(
					'an explicit occasion planner and catalog suitability evidence',
					'ตัววางแผนโอกาสที่ผู้ใช้ระบุและหลักฐานความเหมาะสมของสินค้า'
				)
			),
			moduleRecipe(
				'intent-onboarding-08',
				copy('Delivery deadline', 'กำหนดวันที่ต้องได้รับของ'),
				'service',
				'focus',
				['shipping', 'question'],
				copy('Check whether a real delivery deadline can be met.', 'ตรวจว่าจะส่งทันวันที่ต้องการจริงหรือไม่'),
				copy(
					'logistics estimates, destination and promised delivery dates',
					'ข้อมูลประมาณการขนส่ง ปลายทาง และวันที่จัดส่งที่ยืนยันได้'
				)
			),
			moduleRecipe(
				'intent-onboarding-09',
				copy('Comfort/large-print mode', 'โหมดอ่านสบายและตัวอักษรใหญ่'),
				'ready',
				'stack',
				['preferences', 'apply', 'undo'],
				copy('Increase reading size through explicit controls.', 'ขยายตัวอักษรด้วยตัวเลือกที่ผู้ใช้กำหนด'),
				copy(
					'existing language/theme controls and reduced-motion styles',
					'ตัวควบคุมภาษาและธีมเดิมพร้อมรูปแบบลดการเคลื่อนไหว'
				)
			),
			moduleRecipe(
				'intent-onboarding-10',
				copy('Existing-product replacement', 'หาสินค้าทดแทนของเดิม'),
				'service',
				'split',
				['specs', 'products', 'question'],
				copy(
					'Replace an owned product using verified fit information.',
					'หาของแทนสินค้าที่มีโดยใช้ข้อมูลความเหมาะสมที่ตรวจสอบแล้ว'
				),
				copy(
					'owned-product identity and supported replacement mappings',
					'รหัสสินค้าที่เป็นเจ้าของและข้อมูลสินค้าทดแทนที่รองรับ'
				)
			),
			moduleRecipe(
				'intent-onboarding-11',
				copy('Repeat-purchase shortcut', 'ทางลัดซื้อซ้ำ'),
				'service',
				'rail',
				['saved', 'orders', 'products'],
				copy('Reorder an item from genuine purchase history.', 'สั่งสินค้าซ้ำจากประวัติซื้อจริง'),
				copy('authenticated purchase history and reorder eligibility', 'ประวัติซื้อที่ยืนยันบัญชีและสิทธิ์สั่งซ้ำ')
			),
			moduleRecipe(
				'intent-onboarding-12',
				copy('Personalization explanation and opt-out', 'อธิบายการปรับเฉพาะบุคคลและการปิดใช้'),
				'ready',
				'receipt',
				['preferences', 'source', 'undo'],
				copy(
					'Understand proposals and choose direct controls instead.',
					'เข้าใจข้อเสนอและเลือกใช้ตัวควบคุมโดยตรง'
				),
				copy(
					'the existing optional interview and authored presentation choices',
					'คำถามแบบสมัครใจและตัวเลือกการแสดงผลที่มีอยู่'
				)
			)
		]
	},
	{
		id: 'adaptive-homepage',
		title: copy('Adaptive homepage', 'หน้าแรกที่ปรับตามบริบท'),
		purpose: copy(
			'Offer bounded directions backed by declared needs and available evidence.',
			'เสนอแนวทางที่มีขอบเขตจากความต้องการที่ระบุและหลักฐานที่มี'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'adaptive-homepage-01',
				copy('Continue previous task', 'ทำงานเลือกซื้อเดิมต่อ'),
				'ready',
				'stack',
				['scope', 'products', 'preferences'],
				copy('Resume the saved view and current search context.', 'กลับมาใช้มุมมองและบริบทค้นหาที่บันทึกไว้'),
				copy(
					'existing saved plan and in-session store visit state',
					'แผนที่บันทึกไว้และสถานะการเยี่ยมชมร้านในครั้งนี้'
				)
			),
			moduleRecipe(
				'adaptive-homepage-02',
				copy('Recent searches', 'คำค้นล่าสุด'),
				'service',
				'rail',
				['search', 'saved'],
				copy('Return to an earlier search from an actual history.', 'กลับไปคำค้นก่อนหน้าจากประวัติจริง'),
				copy(
					'a consented search-history store and history controls',
					'ประวัติการค้นหาที่ได้รับความยินยอมและตัวควบคุมประวัติ'
				)
			),
			moduleRecipe(
				'adaptive-homepage-03',
				copy('Replenish regular items', 'เติมของที่ซื้อเป็นประจำ'),
				'service',
				'tiles',
				['saved', 'products'],
				copy(
					'Identify replenishment needs from consented purchase evidence.',
					'หาของที่ต้องเติมจากประวัติซื้อที่ยินยอมให้ใช้'
				),
				copy('authenticated purchase history and reorder eligibility', 'ประวัติซื้อที่ยืนยันบัญชีและสิทธิ์สั่งซ้ำ')
			),
			moduleRecipe(
				'adaptive-homepage-04',
				copy('Current category shelf', 'ชั้นสินค้าหมวดปัจจุบัน'),
				'ready',
				'tiles',
				['categories', 'products', 'price'],
				copy('Continue browsing the explicitly selected category.', 'เลือกดูต่อในหมวดที่ผู้ใช้เลือกไว้'),
				copy(
					'canonical category names and explicit category selection',
					'ชื่อหมวดจากแค็ตตาล็อกและการเลือกหมวดโดยผู้ใช้'
				)
			),
			moduleRecipe(
				'adaptive-homepage-05',
				copy('Moment shelf', 'ชั้นสินค้าตามบริบทขณะนั้น'),
				'service',
				'tiles',
				['scope', 'products'],
				copy('See products linked to a declared shopping moment.', 'ดูสินค้าที่เชื่อมกับบริบทการซื้อที่ระบุเอง'),
				copy(
					'explicit moment state and supported moment-to-product mappings',
					'สถานะบริบทที่ผู้ใช้ระบุและข้อมูลจับคู่บริบทกับสินค้า'
				)
			),
			moduleRecipe(
				'adaptive-homepage-06',
				copy('Weather-relevant shelf', 'ชั้นสินค้าที่เกี่ยวข้องกับอากาศ'),
				'service',
				'tiles',
				['scope', 'products', 'source'],
				copy(
					'Check weather relevance using consented location and evidence.',
					'ตรวจความเกี่ยวข้องกับอากาศจากตำแหน่งที่ยินยอมและหลักฐาน'
				),
				copy(
					'location consent, weather data and supported product relevance',
					'ความยินยอมใช้ตำแหน่ง ข้อมูลอากาศ และหลักฐานความเกี่ยวข้องของสินค้า'
				)
			),
			moduleRecipe(
				'adaptive-homepage-07',
				copy('Occasion planner', 'ตัววางแผนตามโอกาส'),
				'service',
				'stack',
				['question', 'products', 'saved'],
				copy('Plan purchases for an explicitly chosen occasion.', 'วางแผนซื้อสำหรับโอกาสที่เลือกเอง'),
				copy(
					'an explicit occasion planner and catalog suitability evidence',
					'ตัววางแผนโอกาสที่ผู้ใช้ระบุและหลักฐานความเหมาะสมของสินค้า'
				)
			),
			moduleRecipe(
				'adaptive-homepage-08',
				copy('Complete-a-project shelf', 'ชั้นสินค้าให้งานสำเร็จครบ'),
				'service',
				'split',
				['specs', 'products', 'source'],
				copy(
					'Find verified items needed to complete a defined project.',
					'หาของที่ตรวจสอบแล้วว่าจำเป็นต่องานที่ระบุ'
				),
				copy(
					'task requirements and verified complementary-product relationships',
					'ข้อกำหนดของงานและความสัมพันธ์สินค้าที่ใช้ร่วมกันซึ่งตรวจสอบได้'
				)
			),
			moduleRecipe(
				'adaptive-homepage-09',
				copy('Complete-the-look', 'เลือกให้เข้าชุด'),
				'service',
				'tiles',
				['photos', 'products', 'source'],
				copy(
					'Build a coordinated set from supported style relationships.',
					'จัดชุดจากข้อมูลความเข้ากันที่รองรับ'
				),
				copy(
					'supported style relationships and complete outfit/set evidence',
					'ข้อมูลความเข้าชุดและหลักฐานองค์ประกอบของชุดครบถ้วน'
				)
			),
			moduleRecipe(
				'adaptive-homepage-10',
				copy('Family essentials', 'ของจำเป็นสำหรับครอบครัว'),
				'service',
				'tiles',
				['question', 'products'],
				copy(
					'Choose household essentials from explicit requirements.',
					'เลือกของจำเป็นในบ้านจากความต้องการที่ระบุชัด'
				),
				copy(
					'explicit household requirements and supported suitability data',
					'ความต้องการครัวเรือนที่ระบุชัดและข้อมูลความเหมาะสมที่รองรับ'
				)
			),
			moduleRecipe(
				'adaptive-homepage-11',
				copy('Budget picks', 'ตัวเลือกในงบ'),
				'ready',
				'tiles',
				['budget', 'products', 'price'],
				copy(
					"View catalog items within the shopper's stated ceiling.",
					'ดูสินค้าจากแค็ตตาล็อกที่อยู่ในเพดานงบที่ระบุ'
				),
				copy("the shopper's explicit catalog price ceiling", 'เพดานราคาสินค้าที่ผู้ใช้กำหนดเอง')
			),
			moduleRecipe(
				'adaptive-homepage-12',
				copy('Premium step-up', 'ตัวเลือกที่เพิ่มระดับคุณสมบัติ'),
				'service',
				'split',
				['specs', 'price', 'source'],
				copy(
					'Understand evidenced benefits before paying for an upgrade.',
					'เข้าใจประโยชน์ที่มีหลักฐานก่อนจ่ายเพื่อรุ่นสูงขึ้น'
				),
				copy(
					'comparable product differences and evidenced incremental benefit',
					'ข้อแตกต่างที่เทียบกันได้และหลักฐานประโยชน์ที่เพิ่มขึ้น'
				)
			),
			moduleRecipe(
				'adaptive-homepage-13',
				copy('New-product discovery', 'ค้นพบสินค้าใหม่'),
				'service',
				'tiles',
				['products', 'source'],
				copy(
					'Distinguish newly introduced products using actual dates.',
					'แยกสินค้าที่เพิ่งเปิดตัวจากวันที่จริง'
				),
				copy(
					'catalog introduction dates and a supported newness criterion',
					'วันที่เริ่มขายในแค็ตตาล็อกและเกณฑ์ความใหม่ที่รองรับ'
				)
			),
			moduleRecipe(
				'adaptive-homepage-14',
				copy('Live shopping', 'ช้อปผ่านไลฟ์'),
				'service',
				'focus',
				['photos', 'products', 'question'],
				copy(
					'Watch a relevant live presentation with verified product links.',
					'ดูการนำเสนอสดที่เกี่ยวข้องพร้อมลิงก์สินค้าที่ตรวจสอบแล้ว'
				),
				copy(
					'a live-stream service and verified stream/product associations',
					'บริการถ่ายทอดสดและข้อมูลเชื่อมรายการกับสินค้าที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'adaptive-homepage-15',
				copy('Short-video reviews', 'รีวิววิดีโอสั้น'),
				'service',
				'tiles',
				['photos', 'review', 'source'],
				copy(
					'Evaluate a product through attributed video reviews.',
					'ประเมินสินค้าผ่านรีวิววิดีโอที่ระบุแหล่งได้'
				),
				copy(
					'licensed video metadata, playback and verified product associations',
					'สิทธิ์และข้อมูลวิดีโอ ระบบเล่น และข้อมูลเชื่อมสินค้าที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'adaptive-homepage-16',
				copy('Saved-product price update', 'อัปเดตราคาสินค้าที่บันทึก'),
				'service',
				'receipt',
				['saved', 'price', 'source'],
				copy(
					"See whether a saved product's observed price changed.",
					'ดูว่าราคาที่ตรวจพบของสินค้าที่บันทึกเปลี่ยนหรือไม่'
				),
				copy(
					'timestamped price observations and saved-item watch state',
					'ประวัติราคาพร้อมเวลาและสถานะติดตามสินค้าที่บันทึกไว้'
				)
			),
			moduleRecipe(
				'adaptive-homepage-17',
				copy('Membership/reward summary', 'สรุปสมาชิกและรางวัล'),
				'service',
				'receipt',
				['scope', 'voucher', 'source'],
				copy('Inspect genuine membership and reward entitlements.', 'ตรวจสถานะสมาชิกและสิทธิ์รางวัลจริง'),
				copy('authenticated membership and reward entitlements', 'สถานะสมาชิกที่ยืนยันบัญชีและสิทธิ์รางวัล')
			),
			moduleRecipe(
				'adaptive-homepage-18',
				copy('“You’ve seen everything relevant” ending', 'ส่วนจบเมื่อดูผลลัพธ์ที่เกี่ยวข้องครบ'),
				'ready',
				'receipt',
				['products', 'scope'],
				copy(
					'Know when the current finite fixture results have ended.',
					'ทราบว่าได้ดูผลลัพธ์ตัวอย่างปัจจุบันที่มีขอบเขตครบแล้ว'
				),
				copy(
					'the finite current fixture result list and result count',
					'รายการผลลัพธ์ตัวอย่างปัจจุบันที่มีขอบเขตและจำนวนผลลัพธ์'
				)
			)
		]
	},
	{
		id: 'search-discovery',
		title: copy('Search and discovery', 'การค้นหาและค้นพบ'),
		purpose: copy(
			'Help shoppers express, inspect and revise a search.',
			'ช่วยระบุ ตรวจ และแก้การค้นหาของผู้ใช้'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'search-discovery-01',
				copy('Text search', 'ค้นหาด้วยข้อความ'),
				'ready',
				'focus',
				['search', 'products'],
				copy('Search canonical names and supported catalog text.', 'ค้นชื่อและข้อความที่รองรับในแค็ตตาล็อก'),
				copy(
					'existing query controls and canonical fixture search',
					'ช่องค้นหาเดิมและการค้นในแค็ตตาล็อกตัวอย่าง'
				)
			),
			moduleRecipe(
				'search-discovery-02',
				copy('Conversational search', 'ค้นหาผ่านบทสนทนา'),
				'ready',
				'split',
				['question', 'search', 'products'],
				copy(
					'Express a request through the validated local assistant.',
					'บอกความต้องการผ่านผู้ช่วยในเครื่องที่ตรวจข้อเสนอแล้ว'
				),
				copy(
					'the existing validated offline assistant and cite-or-decline boundary',
					'ผู้ช่วยออฟไลน์ที่ตรวจสอบข้อเสนอและขอบเขตอ้างอิงหรือปฏิเสธการยืนยัน'
				)
			),
			moduleRecipe(
				'search-discovery-03',
				copy('Category suggestions', 'คำแนะนำหมวดสินค้า'),
				'service',
				'tiles',
				['categories', 'search'],
				copy(
					'Inspect evidence for a suggested search category.',
					'ตรวจเหตุผลของหมวดที่แนะนำสำหรับการค้นหา'
				),
				copy(
					'an explicit category-suggestion policy and matching evidence',
					'หลักเกณฑ์แนะนำหมวดและหลักฐานการจับคู่ที่ชัดเจน'
				)
			),
			moduleRecipe(
				'search-discovery-04',
				copy('Query correction', 'แก้ไขคำค้น'),
				'service',
				'rail',
				['search', 'question'],
				copy('Confirm a proposed correction before replacing a query.', 'ยืนยันคำที่แก้ก่อนแทนคำค้นเดิม'),
				copy(
					'a query-correction dictionary and shopper-confirmed replacements',
					'พจนานุกรมแก้คำค้นและการยืนยันคำแทนจากผู้ใช้'
				)
			),
			moduleRecipe(
				'search-discovery-05',
				copy('Search history', 'ประวัติการค้นหา'),
				'service',
				'stack',
				['search', 'saved'],
				copy('Review and reopen consented past queries.', 'ตรวจและเปิดคำค้นในอดีตที่ยินยอมให้เก็บ'),
				copy(
					'a consented search-history store and history controls',
					'ประวัติการค้นหาที่ได้รับความยินยอมและตัวควบคุมประวัติ'
				)
			),
			moduleRecipe(
				'search-discovery-06',
				copy('Search-by-use-case', 'ค้นหาตามการใช้งาน'),
				'ready',
				'split',
				['search', 'products', 'source'],
				copy('Find matches in supplied use-case text and tags.', 'หาสินค้าที่ตรงกับข้อความการใช้และแท็กที่มี'),
				copy(
					'existing query controls and canonical fixture search',
					'ช่องค้นหาเดิมและการค้นในแค็ตตาล็อกตัวอย่าง'
				)
			),
			moduleRecipe(
				'search-discovery-07',
				copy('Search-by-recipient', 'ค้นหาตามผู้รับ'),
				'service',
				'split',
				['question', 'products'],
				copy(
					'Match recipient requirements without guessing their traits.',
					'จับคู่ความต้องการผู้รับโดยไม่เดาลักษณะของบุคคล'
				),
				copy(
					'explicit recipient requirements and supported product matching',
					'ความต้องการของผู้รับที่ระบุชัดและข้อมูลจับคู่สินค้าที่รองรับ'
				)
			),
			moduleRecipe(
				'search-discovery-08',
				copy('Search-by-budget', 'ค้นหาตามงบ'),
				'ready',
				'split',
				['search', 'budget', 'price'],
				copy(
					'Combine an explicit search with a catalog price ceiling.',
					'ใช้คำค้นร่วมกับเพดานราคาที่เลือกเอง'
				),
				copy("the shopper's explicit catalog price ceiling", 'เพดานราคาสินค้าที่ผู้ใช้กำหนดเอง')
			),
			moduleRecipe(
				'search-discovery-09',
				copy('Search-by-delivery date', 'ค้นหาตามวันที่จัดส่ง'),
				'service',
				'split',
				['search', 'shipping'],
				copy(
					'Find items with confirmed delivery dates for a destination.',
					'หาสินค้าที่มีวันส่งถึงปลายทางซึ่งยืนยันได้'
				),
				copy(
					'logistics estimates, destination and promised delivery dates',
					'ข้อมูลประมาณการขนส่ง ปลายทาง และวันที่จัดส่งที่ยืนยันได้'
				)
			),
			moduleRecipe(
				'search-discovery-10',
				copy('Search-by-specification', 'ค้นหาตามสเปก'),
				'ready',
				'split',
				['search', 'specs', 'products'],
				copy(
					'Use supported specification priorities to examine matches.',
					'ใช้ความสำคัญของสเปกที่รองรับเพื่อตรวจสินค้าที่พบ'
				),
				copy(
					'existing deterministic ranking terms and catalog score inputs',
					'เหตุผลการเรียงแบบกำหนดแน่นอนและคะแนนจากแค็ตตาล็อก'
				)
			),
			moduleRecipe(
				'search-discovery-11',
				copy('Search inside reviews', 'ค้นหาภายในรีวิว'),
				'ready',
				'stack',
				['search', 'review', 'source'],
				copy(
					'Locate words within supplied listing review quotes.',
					'ค้นคำภายในข้อความรีวิวที่รายการสินค้ามี'
				),
				copy(
					"existing search over a listing's fixture review text",
					'การค้นข้อความรีวิวตัวอย่างภายในรายการสินค้าที่มีอยู่'
				)
			),
			moduleRecipe(
				'search-discovery-12',
				copy('Visual discovery', 'ค้นพบสินค้าจากภาพ'),
				'ready',
				'tiles',
				['photos', 'products', 'price'],
				copy(
					'Browse associated catalog pictures to recognize products.',
					'ดูภาพที่เชื่อมกับแค็ตตาล็อกเพื่อจำสินค้า'
				),
				copy(
					'catalog-associated image assets; no visual-search or video inference',
					'ภาพที่เชื่อมกับแค็ตตาล็อก โดยไม่อนุมานจากการค้นด้วยภาพหรือวิดีโอ'
				)
			),
			moduleRecipe(
				'search-discovery-13',
				copy('Compare-from-search', 'เปรียบเทียบจากผลค้นหา'),
				'ready',
				'split',
				['products', 'specs', 'price'],
				copy(
					'Compare current result facts in the existing table.',
					'เทียบข้อเท็จจริงของผลค้นหาปัจจุบันในตารางเดิม'
				),
				copy(
					'existing comparison tables over the current catalog results',
					'ตารางเปรียบเทียบเดิมจากผลลัพธ์แค็ตตาล็อกปัจจุบัน'
				)
			),
			moduleRecipe(
				'search-discovery-14',
				copy('Ask-the-assistant', 'ถามผู้ช่วย'),
				'ready',
				'focus',
				['question', 'source'],
				copy(
					'Ask a listing question and receive citations or a decline.',
					'ถามข้อมูลรายการและรับแหล่งอ้างอิงหรือคำปฏิเสธการยืนยัน'
				),
				copy(
					'the existing validated offline assistant and cite-or-decline boundary',
					'ผู้ช่วยออฟไลน์ที่ตรวจสอบข้อเสนอและขอบเขตอ้างอิงหรือปฏิเสธการยืนยัน'
				)
			),
			moduleRecipe(
				'search-discovery-15',
				copy('Explain why results appeared', 'อธิบายเหตุผลที่ผลลัพธ์ปรากฏ'),
				'ready',
				'receipt',
				['source', 'preferences', 'products'],
				copy(
					'Inspect the deterministic terms behind the current results.',
					'ตรวจเหตุผลแบบกำหนดแน่นอนของผลลัพธ์ปัจจุบัน'
				),
				copy(
					'existing deterministic ranking terms and catalog score inputs',
					'เหตุผลการเรียงแบบกำหนดแน่นอนและคะแนนจากแค็ตตาล็อก'
				)
			)
		]
	},
	{
		id: 'results-listing',
		title: copy('Results and product listing', 'ผลลัพธ์และรายการสินค้า'),
		purpose: copy(
			'Present current results with explicit controls and checkable facts.',
			'แสดงผลลัพธ์พร้อมตัวควบคุมชัดเจนและข้อมูลตรวจสอบได้'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'results-listing-01',
				copy('Visual grid', 'ตารางภาพสินค้า'),
				'ready',
				'tiles',
				['photos', 'products', 'price'],
				copy('Recognize current results through a picture grid.', 'จำสินค้าจากผลลัพธ์ผ่านตารางภาพ'),
				copy(
					'existing theme, layout and detail-field controls',
					'ตัวควบคุมธีม รูปแบบ และช่องรายละเอียดที่มีอยู่'
				)
			),
			moduleRecipe(
				'results-listing-02',
				copy('Compact list', 'รายการกระชับ'),
				'ready',
				'rail',
				['products', 'price'],
				copy('Scan the current catalog results in compact rows.', 'กวาดดูผลลัพธ์ปัจจุบันเป็นแถวกระชับ'),
				copy(
					'existing theme, layout and detail-field controls',
					'ตัวควบคุมธีม รูปแบบ และช่องรายละเอียดที่มีอยู่'
				)
			),
			moduleRecipe(
				'results-listing-03',
				copy('Specification table', 'ตารางข้อมูลจำเพาะ'),
				'ready',
				'split',
				['products', 'specs', 'price'],
				copy('Compare like-for-like catalog specifications.', 'เทียบสเปกชนิดเดียวกันจากแค็ตตาล็อก'),
				copy(
					'existing comparison tables over the current catalog results',
					'ตารางเปรียบเทียบเดิมจากผลลัพธ์แค็ตตาล็อกปัจจุบัน'
				)
			),
			moduleRecipe(
				'results-listing-04',
				copy('Simple three-choice mode', 'โหมดเรียบง่ายสามตัวเลือก'),
				'ready',
				'stack',
				['products', 'price', 'preferences'],
				copy(
					'Reduce the visible choice set with the existing simplified plan.',
					'ลดจำนวนตัวเลือกที่แสดงด้วยแผนเรียบง่ายเดิม'
				),
				copy(
					'the existing simplified-plan option and bounded product list',
					'ตัวเลือกแผนแบบเรียบง่ายและรายการสินค้าที่มีขอบเขต'
				)
			),
			moduleRecipe(
				'results-listing-05',
				copy('Price-first cards', 'การ์ดที่เน้นราคา'),
				'ready',
				'receipt',
				['price', 'products'],
				copy(
					'Make catalog prices prominent during a decision.',
					'ทำให้ราคาจากแค็ตตาล็อกเห็นชัดขณะตัดสินใจ'
				),
				copy(
					'canonical price and optional original-price facts',
					'ราคาจากแค็ตตาล็อกและราคาเดิมเมื่อมีข้อมูล'
				)
			),
			moduleRecipe(
				'results-listing-06',
				copy('Quality-first cards', 'การ์ดที่เน้นคุณสมบัติคุณภาพ'),
				'ready',
				'stack',
				['specs', 'review', 'price'],
				copy(
					'Read supplied specifications and ratings without a quality guarantee.',
					'อ่านสเปกและคะแนนที่มีโดยไม่รับรองคุณภาพเพิ่ม'
				),
				copy(
					'catalog ratings, review counts and supplied review quotes; no distribution',
					'คะแนน จำนวนรีวิว และข้อความรีวิวที่มีในแค็ตตาล็อก โดยไม่มีการแจกแจงคะแนน'
				)
			),
			moduleRecipe(
				'results-listing-07',
				copy('Delivery-first cards', 'การ์ดที่เน้นข้อมูลจัดส่ง'),
				'ready',
				'stack',
				['shipping', 'products', 'price'],
				copy(
					'Compare catalog shipping fees without promising arrival dates.',
					'เทียบค่าจัดส่งจากแค็ตตาล็อกโดยไม่สัญญาวันถึง'
				),
				copy(
					'canonical shipping-fee facts only; no arrival-date estimate',
					'ข้อเท็จจริงค่าจัดส่งจากแค็ตตาล็อกเท่านั้น ไม่มีการประมาณวันถึง'
				)
			),
			moduleRecipe(
				'results-listing-08',
				copy('Accessibility-first cards', 'การ์ดที่อ่านและใช้ง่าย'),
				'ready',
				'stack',
				['products', 'price', 'preferences'],
				copy(
					'Read cards using large text and spacious controls.',
					'อ่านการ์ดด้วยตัวอักษรใหญ่และตัวควบคุมที่เว้นระยะ'
				),
				copy(
					'existing language/theme controls and reduced-motion styles',
					'ตัวควบคุมภาษาและธีมเดิมพร้อมรูปแบบลดการเคลื่อนไหว'
				)
			),
			moduleRecipe(
				'results-listing-09',
				copy('Sort controls', 'ตัวควบคุมการเรียง'),
				'ready',
				'rail',
				['preferences', 'products'],
				copy('Choose an explicit existing sort order.', 'เลือกลำดับการเรียงที่มีอยู่ด้วยตนเอง'),
				copy(
					'existing deterministic ranking terms and catalog score inputs',
					'เหตุผลการเรียงแบบกำหนดแน่นอนและคะแนนจากแค็ตตาล็อก'
				)
			),
			moduleRecipe(
				'results-listing-10',
				copy('Removable filters', 'ตัวกรองที่นำออกได้'),
				'ready',
				'rail',
				['categories', 'budget', 'undo'],
				copy(
					'See and remove each active search constraint.',
					'เห็นและนำข้อจำกัดค้นหาที่ใช้อยู่ออกทีละรายการ'
				),
				copy(
					'existing search/filter controls and explicit clear actions',
					'ตัวควบคุมค้นหาและตัวกรองเดิมพร้อมการล้างที่ผู้ใช้เลือก'
				)
			),
			moduleRecipe(
				'results-listing-11',
				copy('Product comparison selection', 'เลือกสินค้าเพื่อเปรียบเทียบ'),
				'service',
				'split',
				['saved', 'products', 'specs'],
				copy(
					'Select arbitrary products for a persistent comparison set.',
					'เลือกสินค้าเองเพื่อเก็บในชุดเปรียบเทียบ'
				),
				copy(
					'persistent product-comparison selection and tray controls',
					'สถานะสินค้าที่เลือกเทียบและตัวควบคุมถาดเปรียบเทียบ'
				)
			),
			moduleRecipe(
				'results-listing-12',
				copy('“Why this order?”', 'เหตุใดจึงเรียงแบบนี้'),
				'ready',
				'receipt',
				['source', 'preferences'],
				copy(
					'Read the same ranking terms that ordered the results.',
					'อ่านเหตุผลเดียวกับที่ใช้จัดลำดับผลลัพธ์'
				),
				copy(
					'existing deterministic ranking terms and catalog score inputs',
					'เหตุผลการเรียงแบบกำหนดแน่นอนและคะแนนจากแค็ตตาล็อก'
				)
			),
			moduleRecipe(
				'results-listing-13',
				copy('Sponsored-result disclosure', 'เปิดเผยผลลัพธ์ที่ได้รับการสนับสนุน'),
				'service',
				'receipt',
				['source', 'products'],
				copy(
					'Distinguish paid placement using verified sponsorship data.',
					'แยกตำแหน่งที่จ่ายเงินจากข้อมูลสนับสนุนที่ตรวจสอบแล้ว'
				),
				copy(
					'verified paid-placement metadata and disclosure policy',
					'ข้อมูลตำแหน่งโฆษณาที่ตรวจสอบแล้วและนโยบายเปิดเผย'
				)
			),
			moduleRecipe(
				'results-listing-14',
				copy('No-result recovery', 'ช่วยเมื่อไม่พบผลลัพธ์'),
				'ready',
				'stack',
				['search', 'budget', 'undo'],
				copy(
					'Recover from empty results by changing explicit filters.',
					'แก้ผลลัพธ์ว่างโดยปรับตัวกรองที่เลือกเอง'
				),
				copy(
					'existing search/filter controls and explicit clear actions',
					'ตัวควบคุมค้นหาและตัวกรองเดิมพร้อมการล้างที่ผู้ใช้เลือก'
				)
			),
			moduleRecipe(
				'results-listing-15',
				copy('Facts-rechecked receipt', 'ใบตรวจข้อเท็จจริงซ้ำ'),
				'ready',
				'receipt',
				['source', 'price', 'specs'],
				copy(
					'Check displayed facts against the canonical fixture records.',
					'ตรวจข้อมูลที่แสดงกับแค็ตตาล็อกตัวอย่างหลัก'
				),
				copy(
					'existing fact resolution and mounted-fact verification receipts',
					'การอ้างอิงข้อเท็จจริงและใบตรวจข้อมูลที่แสดงอยู่'
				)
			)
		]
	},
	{
		id: 'product-detail',
		title: copy('Product detail page', 'หน้ารายละเอียดสินค้า'),
		purpose: copy(
			'Support a product decision with facts and clearly unavailable services.',
			'ช่วยตัดสินใจจากข้อเท็จจริงและระบุบริการที่ยังไม่พร้อม'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'product-detail-01',
				copy('Product media', 'สื่อสินค้า'),
				'ready',
				'focus',
				['photos', 'products'],
				copy(
					'Inspect available catalog-associated product images.',
					'ตรวจภาพสินค้าที่มีและเชื่อมกับแค็ตตาล็อก'
				),
				copy(
					'catalog-associated image assets; no visual-search or video inference',
					'ภาพที่เชื่อมกับแค็ตตาล็อก โดยไม่อนุมานจากการค้นด้วยภาพหรือวิดีโอ'
				)
			),
			moduleRecipe(
				'product-detail-02',
				copy('Product name', 'ชื่อสินค้า'),
				'ready',
				'focus',
				['products', 'source'],
				copy(
					'Read the exact localized catalog product name.',
					'อ่านชื่อสินค้าตรงตามแค็ตตาล็อกในภาษาที่เลือก'
				),
				copy('localized canonical product names', 'ชื่อสินค้าสองภาษาจากแค็ตตาล็อก')
			),
			moduleRecipe(
				'product-detail-03',
				copy('Current and original price', 'ราคาปัจจุบันและราคาเดิม'),
				'ready',
				'receipt',
				['price', 'source'],
				copy(
					'Inspect catalog price and original price only when present.',
					'ตรวจราคาและราคาเดิมจากแค็ตตาล็อกเฉพาะเมื่อมีข้อมูล'
				),
				copy(
					'canonical price and optional original-price facts',
					'ราคาจากแค็ตตาล็อกและราคาเดิมเมื่อมีข้อมูล'
				)
			),
			moduleRecipe(
				'product-detail-04',
				copy('Variant selector', 'ตัวเลือกแบบสินค้า'),
				'service',
				'tiles',
				['specs', 'products'],
				copy(
					'Choose a real purchasable variant with known availability.',
					'เลือกแบบสินค้าที่ซื้อได้จริงและทราบสถานะพร้อมขาย'
				),
				copy(
					'variant identifiers, selectable options and current stock',
					'รหัสตัวเลือกสินค้า ตัวเลือกที่เลือกได้ และสต็อกปัจจุบัน'
				)
			),
			moduleRecipe(
				'product-detail-05',
				copy('Delivery estimate', 'ประมาณการจัดส่ง'),
				'service',
				'receipt',
				['shipping', 'source'],
				copy(
					'Check an evidence-backed arrival estimate for the destination.',
					'ตรวจประมาณการวันถึงปลายทางที่มีหลักฐาน'
				),
				copy(
					'logistics estimates, destination and promised delivery dates',
					'ข้อมูลประมาณการขนส่ง ปลายทาง และวันที่จัดส่งที่ยืนยันได้'
				)
			),
			moduleRecipe(
				'product-detail-06',
				copy('Seller information', 'ข้อมูลผู้ขาย'),
				'ready',
				'receipt',
				['scope', 'source'],
				copy(
					'Identify the seller using canonical shop information.',
					'ระบุผู้ขายจากข้อมูลร้านในแค็ตตาล็อก'
				),
				copy(
					'canonical shop identity fields; no inferred trust score',
					'ข้อมูลตัวตนร้านจากแค็ตตาล็อก โดยไม่อนุมานคะแนนความน่าเชื่อถือ'
				)
			),
			moduleRecipe(
				'product-detail-07',
				copy('Specification table', 'ตารางข้อมูลจำเพาะ'),
				'ready',
				'split',
				['specs', 'source'],
				copy(
					'Inspect listing specifications with their canonical units.',
					'ตรวจสเปกรายการพร้อมหน่วยจากแค็ตตาล็อก'
				),
				copy(
					'canonical specifications with category-specific keys and units',
					'สเปกจากแค็ตตาล็อกพร้อมคีย์และหน่วยตามหมวด'
				)
			),
			moduleRecipe(
				'product-detail-08',
				copy('Short summary', 'สรุปสั้น'),
				'ready',
				'stack',
				['products', 'source'],
				copy(
					'Read the supplied listing summary without generated claims.',
					'อ่านสรุปที่รายการมีโดยไม่สร้างคำกล่าวอ้างเพิ่ม'
				),
				copy('localized canonical listing summaries', 'สรุปรายการสินค้าสองภาษาจากแค็ตตาล็อก')
			),
			moduleRecipe(
				'product-detail-09',
				copy('Review overview', 'ภาพรวมรีวิว'),
				'ready',
				'receipt',
				['review', 'source'],
				copy(
					'Read catalog ratings, counts and supplied review quotes.',
					'อ่านคะแนน จำนวน และข้อความรีวิวที่แค็ตตาล็อกมี'
				),
				copy(
					'catalog ratings, review counts and supplied review quotes; no distribution',
					'คะแนน จำนวนรีวิว และข้อความรีวิวที่มีในแค็ตตาล็อก โดยไม่มีการแจกแจงคะแนน'
				)
			),
			moduleRecipe(
				'product-detail-10',
				copy('Review gallery', 'แกลเลอรีรีวิว'),
				'service',
				'tiles',
				['photos', 'review', 'source'],
				copy(
					'Inspect attributable buyer media rather than invented review images.',
					'ตรวจสื่อผู้ซื้อที่ระบุที่มาได้แทนภาพรีวิวที่สร้างขึ้น'
				),
				copy('verified buyer-review media and attribution', 'สื่อรีวิวผู้ซื้อที่ตรวจสอบแล้วและข้อมูลผู้ให้สื่อ')
			),
			moduleRecipe(
				'product-detail-11',
				copy('Certification and authenticity', 'การรับรองและความแท้'),
				'service',
				'receipt',
				['source', 'specs'],
				copy(
					'Verify product certification and authenticity with issuer records.',
					'ตรวจการรับรองและความแท้จากข้อมูลผู้ออกหลักฐาน'
				),
				copy(
					'issuer-backed certification records and authenticity evidence',
					'บันทึกการรับรองจากผู้ออกและหลักฐานความแท้'
				)
			),
			moduleRecipe(
				'product-detail-12',
				copy('Warranty and return policy', 'นโยบายรับประกันและคืนสินค้า'),
				'service',
				'receipt',
				['source', 'question'],
				copy(
					'Read actual warranty and return terms before commitment.',
					'อ่านเงื่อนไขรับประกันและคืนจริงก่อนตกลงซื้อ'
				),
				copy(
					'actual seller warranty and return-policy terms; duration specs alone are insufficient',
					'เงื่อนไขรับประกันและคืนสินค้าจริงของร้าน โดยระยะประกันในสเปกอย่างเดียวไม่พอ'
				)
			),
			moduleRecipe(
				'product-detail-13',
				copy('Compatibility checker', 'ตัวตรวจความเข้ากันได้'),
				'service',
				'split',
				['specs', 'products', 'source'],
				copy(
					'Confirm selected products work together using verified relationships.',
					'ยืนยันว่าสินค้าที่เลือกใช้ร่วมกันได้จากข้อมูลที่ตรวจสอบแล้ว'
				),
				copy(
					'verified compatibility relationships between selected products',
					'ข้อมูลความเข้ากันได้ที่ตรวจสอบแล้วระหว่างสินค้าที่เลือก'
				)
			),
			moduleRecipe(
				'product-detail-14',
				copy('“Good for your need” explanation', 'อธิบายว่าเหมาะกับความต้องการอย่างไร'),
				'ready',
				'receipt',
				['preferences', 'specs', 'source'],
				copy(
					'Explain matches using declared priorities and existing ranking reasons.',
					'อธิบายการจับคู่จากสิ่งสำคัญที่ระบุและเหตุผลการเรียงเดิม'
				),
				copy(
					'existing deterministic ranking terms and catalog score inputs',
					'เหตุผลการเรียงแบบกำหนดแน่นอนและคะแนนจากแค็ตตาล็อก'
				)
			),
			moduleRecipe(
				'product-detail-15',
				copy('Honest step-up comparison', 'เปรียบเทียบรุ่นสูงขึ้นอย่างตรงไปตรงมา'),
				'service',
				'split',
				['specs', 'price', 'source'],
				copy(
					"Compare an upgrade's supported benefit with its full extra cost.",
					'เทียบประโยชน์รุ่นสูงขึ้นที่มีหลักฐานกับค่าใช้จ่ายเพิ่มทั้งหมด'
				),
				copy(
					'comparable product differences and evidenced incremental benefit',
					'ข้อแตกต่างที่เทียบกันได้และหลักฐานประโยชน์ที่เพิ่มขึ้น'
				)
			),
			moduleRecipe(
				'product-detail-16',
				copy('Complete-the-set', 'เลือกให้ครบชุด'),
				'service',
				'tiles',
				['products', 'specs', 'source'],
				copy(
					'Identify verified missing pieces of a compatible set.',
					'ระบุส่วนที่ขาดของชุดที่เข้ากันได้จากข้อมูลตรวจสอบแล้ว'
				),
				copy(
					'task requirements and verified complementary-product relationships',
					'ข้อกำหนดของงานและความสัมพันธ์สินค้าที่ใช้ร่วมกันซึ่งตรวจสอบได้'
				)
			),
			moduleRecipe(
				'product-detail-17',
				copy('Best-price calculation', 'คำนวณราคาที่ดีที่สุด'),
				'ready',
				'receipt',
				['price', 'voucher', 'shipping'],
				copy(
					"Inspect the existing optimizer's legal fixture deal.",
					'ตรวจดีลที่ถูกเงื่อนไขจากระบบคำนวณราคาเดิม'
				),
				copy(
					'the existing optimizer, canonical basket facts and shared simulated coin balance',
					'ระบบคำนวณราคาเดิม ข้อมูลตะกร้าจากแค็ตตาล็อก และยอดเหรียญจำลองร่วมกัน'
				)
			),
			moduleRecipe(
				'product-detail-18',
				copy('Add-to-cart/buy action', 'เพิ่มตะกร้าหรือซื้อ'),
				'service',
				'stack',
				['products', 'price', 'payment'],
				copy(
					'Separate available local cart selection from unavailable purchase commitment.',
					'แยกการเลือกใส่ตะกร้าในเครื่องที่ใช้ได้จากการซื้อจริงที่ยังไม่พร้อม'
				),
				copy(
					'transactional checkout, current stock and payment confirmation; local add-to-cart alone is available',
					'ระบบชำระเงิน สต็อกปัจจุบัน และการยืนยันการจ่าย โดยมีเพียงการเพิ่มตะกร้าในเครื่องที่ใช้ได้'
				)
			)
		]
	},
	{
		id: 'trust-proof',
		title: copy('Trust and decision proof', 'ความเชื่อมั่นและหลักฐานประกอบการตัดสินใจ'),
		purpose: copy(
			'Separate checkable facts from evidence that is still missing.',
			'แยกข้อเท็จจริงตรวจสอบได้จากหลักฐานที่ยังขาด'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'trust-proof-01',
				copy('Verified catalog-fact receipt', 'ใบตรวจข้อเท็จจริงจากแค็ตตาล็อก'),
				'ready',
				'receipt',
				['source', 'price', 'specs'],
				copy(
					'Verify displayed values against their canonical fixture records.',
					'ตรวจค่าที่แสดงเทียบกับแค็ตตาล็อกตัวอย่างหลัก'
				),
				copy(
					'existing fact resolution and mounted-fact verification receipts',
					'การอ้างอิงข้อเท็จจริงและใบตรวจข้อมูลที่แสดงอยู่'
				)
			),
			moduleRecipe(
				'trust-proof-02',
				copy('Seller trust summary', 'สรุปความน่าเชื่อถือผู้ขาย'),
				'service',
				'receipt',
				['scope', 'source'],
				copy(
					'Inspect actual seller reliability rather than an inferred trust score.',
					'ตรวจความน่าเชื่อถือจริงของร้านแทนคะแนนที่อนุมาน'
				),
				copy(
					'verified seller performance, dispute and reliability records',
					'ข้อมูลผลงานร้าน ข้อพิพาท และความน่าเชื่อถือที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'trust-proof-03',
				copy('Authenticity source', 'แหล่งยืนยันความแท้'),
				'service',
				'receipt',
				['source', 'products'],
				copy(
					'Trace an authenticity claim to verified product provenance.',
					'ติดตามคำกล่าวอ้างความแท้ไปยังที่มาสินค้าที่ตรวจสอบแล้ว'
				),
				copy(
					'traceable product provenance and verified authenticity records',
					'ที่มาสินค้าที่ติดตามได้และบันทึกยืนยันความแท้'
				)
			),
			moduleRecipe(
				'trust-proof-04',
				copy('Certification source', 'แหล่งข้อมูลการรับรอง'),
				'service',
				'receipt',
				['source', 'specs'],
				copy(
					'Inspect certification evidence from its issuing authority.',
					'ตรวจหลักฐานการรับรองจากหน่วยงานผู้ออก'
				),
				copy(
					'issuer-backed certification records and authenticity evidence',
					'บันทึกการรับรองจากผู้ออกและหลักฐานความแท้'
				)
			),
			moduleRecipe(
				'trust-proof-05',
				copy('Review distribution', 'การแจกแจงคะแนนรีวิว'),
				'service',
				'stack',
				['review', 'source'],
				copy('See the true count behind each rating level.', 'ดูจำนวนจริงของรีวิวในแต่ละระดับคะแนน'),
				copy(
					'per-rating review totals from an authoritative review source',
					'จำนวนรีวิวแยกตามคะแนนจากแหล่งรีวิวที่เชื่อถือได้'
				)
			),
			moduleRecipe(
				'trust-proof-06',
				copy('Verified-purchase filter', 'ตัวกรองผู้ซื้อจริง'),
				'service',
				'rail',
				['review', 'source'],
				copy('Filter only reviews with a verified purchase record.', 'กรองเฉพาะรีวิวที่มีหลักฐานซื้อจริง'),
				copy('verified-purchase flags attached to individual reviews', 'สถานะซื้อจริงที่ผูกกับแต่ละรีวิว')
			),
			moduleRecipe(
				'trust-proof-07',
				copy('Common review themes', 'หัวข้อที่พบบ่อยในรีวิว'),
				'service',
				'tiles',
				['review', 'source'],
				copy(
					'Inspect recurring review themes with traceable supporting quotes.',
					'ตรวจหัวข้อรีวิวที่เกิดซ้ำพร้อมข้อความรองรับที่ตรวจที่มาได้'
				),
				copy(
					'source-linked review theme annotations; isolated quotes are insufficient',
					'ป้ายหัวข้อรีวิวที่เชื่อมแหล่งอ้างอิง โดยข้อความบางส่วนอย่างเดียวไม่พอ'
				)
			),
			moduleRecipe(
				'trust-proof-08',
				copy('Return-rate warning, if available', 'คำเตือนอัตราคืนสินค้าเมื่อมีข้อมูล'),
				'service',
				'receipt',
				['source', 'products'],
				copy(
					'Assess a return-rate warning using its denominator and time window.',
					'ประเมินคำเตือนอัตราคืนจากฐานจำนวนและช่วงเวลา'
				),
				copy(
					'auditable return counts, sales denominators and observation windows',
					'จำนวนคืนสินค้า ฐานจำนวนขาย และช่วงเวลาที่ตรวจสอบได้'
				)
			),
			moduleRecipe(
				'trust-proof-09',
				copy('Price-history explanation', 'คำอธิบายประวัติราคา'),
				'service',
				'receipt',
				['price', 'source'],
				copy(
					'Understand observed price changes without inventing a trend.',
					'เข้าใจการเปลี่ยนราคาที่พบโดยไม่สร้างแนวโน้มสมมติ'
				),
				copy(
					'timestamped price observations and saved-item watch state',
					'ประวัติราคาพร้อมเวลาและสถานะติดตามสินค้าที่บันทึกไว้'
				)
			),
			moduleRecipe(
				'trust-proof-10',
				copy('Recommendation reason', 'เหตุผลของคำแนะนำ'),
				'ready',
				'receipt',
				['preferences', 'source'],
				copy(
					'Inspect existing deterministic reasons for a catalog recommendation.',
					'ตรวจเหตุผลแบบกำหนดแน่นอนของคำแนะนำจากแค็ตตาล็อก'
				),
				copy(
					'existing deterministic ranking terms and catalog score inputs',
					'เหตุผลการเรียงแบบกำหนดแน่นอนและคะแนนจากแค็ตตาล็อก'
				)
			),
			moduleRecipe(
				'trust-proof-11',
				copy('Sponsored-content label', 'ป้ายเนื้อหาที่มีผู้สนับสนุน'),
				'service',
				'receipt',
				['source', 'products'],
				copy(
					'Identify commercial placement from verified disclosure data.',
					'ระบุตำแหน่งทางการค้าจากข้อมูลเปิดเผยที่ตรวจสอบแล้ว'
				),
				copy(
					'verified paid-placement metadata and disclosure policy',
					'ข้อมูลตำแหน่งโฆษณาที่ตรวจสอบแล้วและนโยบายเปิดเผย'
				)
			),
			moduleRecipe(
				'trust-proof-12',
				copy('“Cannot confirm” state', 'สถานะยืนยันไม่ได้'),
				'ready',
				'focus',
				['question', 'source'],
				copy(
					'Receive an explicit decline when a listing cannot support an answer.',
					'ได้รับคำปฏิเสธการยืนยันเมื่อรายการไม่มีหลักฐานรองรับคำตอบ'
				),
				copy(
					'the existing validated offline assistant and cite-or-decline boundary',
					'ผู้ช่วยออฟไลน์ที่ตรวจสอบข้อเสนอและขอบเขตอ้างอิงหรือปฏิเสธการยืนยัน'
				)
			)
		]
	},
	{
		id: 'live-video-social',
		title: copy('Live, video, and social commerce', 'ไลฟ์ วิดีโอ และการค้าผ่านสังคม'),
		purpose: copy(
			'Map content-commerce anatomy without inventing media or relationships.',
			'กำหนดโครงสื่อเพื่อการค้าโดยไม่สร้างสื่อหรือความสัมพันธ์สมมติ'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'live-video-social-01',
				copy('Relevant live stream', 'ไลฟ์ที่เกี่ยวข้อง'),
				'service',
				'focus',
				['photos', 'products', 'source'],
				copy(
					'Open a relevant live stream with verified product context.',
					'เปิดไลฟ์ที่เกี่ยวข้องพร้อมบริบทสินค้าที่ตรวจสอบแล้ว'
				),
				copy(
					'a live-stream service and verified stream/product associations',
					'บริการถ่ายทอดสดและข้อมูลเชื่อมรายการกับสินค้าที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'live-video-social-02',
				copy('Live product tray', 'ถาดสินค้าในไลฟ์'),
				'service',
				'rail',
				['photos', 'products', 'price'],
				copy(
					'Inspect products actually associated with the current stream.',
					'ตรวจสินค้าที่เชื่อมกับรายการสดปัจจุบันจริง'
				),
				copy(
					'a live-stream service and verified stream/product associations',
					'บริการถ่ายทอดสดและข้อมูลเชื่อมรายการกับสินค้าที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'live-video-social-03',
				copy('Question-to-seller', 'คำถามถึงผู้ขาย'),
				'service',
				'focus',
				['question', 'scope'],
				copy(
					'Send a question through a real seller communication channel.',
					'ส่งคำถามผ่านช่องทางติดต่อร้านที่มีจริง'
				),
				copy('an authenticated seller messaging service', 'บริการส่งข้อความถึงร้านที่ยืนยันบัญชี')
			),
			moduleRecipe(
				'live-video-social-04',
				copy('Product demonstration chapter', 'บทสาธิตสินค้า'),
				'service',
				'stack',
				['photos', 'specs', 'source'],
				copy(
					'Jump to an authored demonstration chapter for a product.',
					'เปิดบทสาธิตที่กำหนดไว้สำหรับสินค้า'
				),
				copy(
					'licensed demonstration videos with authored chapter timestamps',
					'วิดีโอสาธิตที่มีสิทธิ์พร้อมเวลาของแต่ละบท'
				)
			),
			moduleRecipe(
				'live-video-social-05',
				copy('Short-video feed', 'ฟีดวิดีโอสั้น'),
				'service',
				'tiles',
				['photos', 'products'],
				copy(
					'Browse licensed short videos with accountable product links.',
					'ดูวิดีโอสั้นที่มีสิทธิ์พร้อมลิงก์สินค้าที่ตรวจสอบได้'
				),
				copy(
					'licensed video metadata, playback and verified product associations',
					'สิทธิ์และข้อมูลวิดีโอ ระบบเล่น และข้อมูลเชื่อมสินค้าที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'live-video-social-06',
				copy('Video-to-product mapping', 'การเชื่อมวิดีโอกับสินค้า'),
				'service',
				'split',
				['photos', 'products', 'source'],
				copy(
					'Check which canonical products a video actually demonstrates.',
					'ตรวจว่าวิดีโอแสดงสินค้ารหัสใดจริง'
				),
				copy(
					'verified video-to-product IDs and content availability',
					'รหัสสินค้าที่เชื่อมวิดีโออย่างตรวจสอบได้และสถานะสื่อ'
				)
			),
			moduleRecipe(
				'live-video-social-07',
				copy('Creator disclosure', 'เปิดเผยผู้สร้างเนื้อหา'),
				'service',
				'receipt',
				['scope', 'source'],
				copy(
					'Know the creator and their declared commercial relationship.',
					'ทราบผู้สร้างและความสัมพันธ์ทางการค้าที่เปิดเผย'
				),
				copy(
					'verified creator identity and commercial-relationship disclosures',
					'ตัวตนผู้สร้างที่ตรวจสอบแล้วและการเปิดเผยความสัมพันธ์ทางการค้า'
				)
			),
			moduleRecipe(
				'live-video-social-08',
				copy('Affiliate disclosure', 'เปิดเผยความสัมพันธ์พันธมิตร'),
				'service',
				'receipt',
				['source', 'products'],
				copy(
					'Understand affiliate compensation before following a product link.',
					'เข้าใจค่าตอบแทนพันธมิตรก่อนเปิดลิงก์สินค้า'
				),
				copy(
					'verified affiliate attribution and compensation disclosure',
					'ข้อมูลพันธมิตรที่ตรวจสอบแล้วและการเปิดเผยค่าตอบแทน'
				)
			),
			moduleRecipe(
				'live-video-social-09',
				copy('Save video product', 'บันทึกสินค้าจากวิดีโอ'),
				'service',
				'rail',
				['saved', 'photos', 'products'],
				copy(
					'Save a product with its verified video association.',
					'บันทึกสินค้าพร้อมข้อมูลเชื่อมวิดีโอที่ตรวจสอบแล้ว'
				),
				copy(
					'a saved-video store and verified video/product associations',
					'ที่เก็บวิดีโอที่บันทึกและข้อมูลเชื่อมสินค้ากับวิดีโอ'
				)
			),
			moduleRecipe(
				'live-video-social-10',
				copy('Compare products from a video', 'เทียบสินค้าจากวิดีโอ'),
				'service',
				'split',
				['photos', 'specs', 'products'],
				copy(
					'Compare products selected from attributable video content.',
					'เทียบสินค้าที่เลือกจากวิดีโอซึ่งระบุที่มาได้'
				),
				copy(
					'verified video/product associations and a product-selection tray',
					'ข้อมูลเชื่อมสินค้ากับวิดีโอและถาดเลือกสินค้าเพื่อเปรียบเทียบ'
				)
			),
			moduleRecipe(
				'live-video-social-11',
				copy('Share a shortlist', 'แชร์รายการที่คัดไว้'),
				'service',
				'stack',
				['saved', 'products', 'source'],
				copy(
					'Share actual selected product IDs rather than only a view style.',
					'แชร์รหัสสินค้าที่เลือกจริงแทนการแชร์เฉพาะรูปแบบมุมมอง'
				),
				copy(
					'a serializable product shortlist and share/restore contract; current links share presentation only',
					'รายการรหัสสินค้าที่แชร์และกู้คืนได้ โดยลิงก์ปัจจุบันแชร์ได้เฉพาะการแสดงผล'
				)
			),
			moduleRecipe(
				'live-video-social-12',
				copy('Resume shopping after content', 'กลับมาเลือกซื้อต่อหลังดูเนื้อหา'),
				'service',
				'stack',
				['saved', 'products', 'photos'],
				copy(
					'Resume a shopping task at the saved content position.',
					'กลับมาเลือกซื้อต่อที่ตำแหน่งสื่อซึ่งบันทึกไว้'
				),
				copy(
					'media playback position and an associated shopping-task state',
					'ตำแหน่งเล่นสื่อและสถานะงานเลือกซื้อที่เชื่อมกัน'
				)
			)
		]
	},
	{
		id: 'smart-basket',
		title: copy('Smart basket and promotion', 'ตะกร้าอัจฉริยะและโปรโมชัน'),
		purpose: copy(
			'Explain basket arithmetic and distinguish unsupported bundle suggestions.',
			'อธิบายการคำนวณตะกร้าและแยกคำแนะนำชุดสินค้าที่ยังไม่รองรับ'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'smart-basket-01',
				copy('Basket grouped by seller', 'ตะกร้าแยกตามผู้ขาย'),
				'ready',
				'stack',
				['scope', 'products', 'price'],
				copy(
					'Group the local cart using canonical seller identities.',
					'จัดกลุ่มตะกร้าในเครื่องตามรหัสร้านจากแค็ตตาล็อก'
				),
				copy(
					'the shared local cart and canonical product/shop IDs',
					'ตะกร้าในเครื่องร่วมกันและรหัสสินค้าและร้านจากแค็ตตาล็อก'
				)
			),
			moduleRecipe(
				'smart-basket-02',
				copy('Final-price preview', 'ดูตัวอย่างราคาสุดท้าย'),
				'ready',
				'receipt',
				['price', 'voucher', 'shipping'],
				copy(
					"Preview the optimizer's total for the current simulated basket.",
					'ดูยอดจากระบบราคาสำหรับตะกร้าจำลองปัจจุบัน'
				),
				copy(
					'the existing optimizer, canonical basket facts and shared simulated coin balance',
					'ระบบคำนวณราคาเดิม ข้อมูลตะกร้าจากแค็ตตาล็อก และยอดเหรียญจำลองร่วมกัน'
				)
			),
			moduleRecipe(
				'smart-basket-03',
				copy('Shipping-fee breakdown', 'แจกแจงค่าจัดส่ง'),
				'ready',
				'receipt',
				['shipping', 'price', 'source'],
				copy(
					'Inspect shipping charges in the existing optimizer receipt.',
					'ตรวจค่าจัดส่งในใบคำนวณจากระบบราคาเดิม'
				),
				copy(
					'the existing optimizer, canonical basket facts and shared simulated coin balance',
					'ระบบคำนวณราคาเดิม ข้อมูลตะกร้าจากแค็ตตาล็อก และยอดเหรียญจำลองร่วมกัน'
				)
			),
			moduleRecipe(
				'smart-basket-04',
				copy('Voucher optimizer', 'ตัวเลือกโค้ดส่วนลดที่เหมาะสม'),
				'ready',
				'receipt',
				['voucher', 'price', 'source'],
				copy(
					'Inspect the legal voucher combination chosen by the optimizer.',
					'ตรวจชุดโค้ดที่ถูกเงื่อนไขซึ่งระบบราคาเลือก'
				),
				copy(
					'the existing optimizer, canonical basket facts and shared simulated coin balance',
					'ระบบคำนวณราคาเดิม ข้อมูลตะกร้าจากแค็ตตาล็อก และยอดเหรียญจำลองร่วมกัน'
				)
			),
			moduleRecipe(
				'smart-basket-05',
				copy('Coin optimizer', 'ตัวคำนวณการใช้เหรียญ'),
				'ready',
				'receipt',
				['voucher', 'price', 'source'],
				copy(
					'Inspect simulated coin use through the single pricing path.',
					'ตรวจการใช้เหรียญจำลองผ่านเส้นทางคำนวณราคาเดียว'
				),
				copy(
					'the existing optimizer, canonical basket facts and shared simulated coin balance',
					'ระบบคำนวณราคาเดิม ข้อมูลตะกร้าจากแค็ตตาล็อก และยอดเหรียญจำลองร่วมกัน'
				)
			),
			moduleRecipe(
				'smart-basket-06',
				copy('Applied-promotion receipt', 'ใบสรุปโปรโมชันที่ใช้'),
				'ready',
				'receipt',
				['voucher', 'price', 'source'],
				copy(
					"Trace applied discounts to the optimizer's receipt lines.",
					'ติดตามส่วนลดที่ใช้ไปยังบรรทัดใบคำนวณ'
				),
				copy(
					'the existing optimizer, canonical basket facts and shared simulated coin balance',
					'ระบบคำนวณราคาเดิม ข้อมูลตะกร้าจากแค็ตตาล็อก และยอดเหรียญจำลองร่วมกัน'
				)
			),
			moduleRecipe(
				'smart-basket-07',
				copy('Unused-voucher explanation', 'อธิบายโค้ดที่ไม่ได้ใช้'),
				'ready',
				'receipt',
				['voucher', 'source', 'question'],
				copy(
					'Understand why an available fixture voucher was excluded.',
					'เข้าใจเหตุที่โค้ดตัวอย่างที่มีไม่ได้ถูกนำมาใช้'
				),
				copy(
					'the existing optimizer, canonical basket facts and shared simulated coin balance',
					'ระบบคำนวณราคาเดิม ข้อมูลตะกร้าจากแค็ตตาล็อก และยอดเหรียญจำลองร่วมกัน'
				)
			),
			moduleRecipe(
				'smart-basket-08',
				copy('Free-shipping progress', 'ความคืบหน้าสิทธิ์ส่งฟรี'),
				'service',
				'receipt',
				['shipping', 'voucher', 'price'],
				copy(
					'Track shipping eligibility without inventing a spend threshold.',
					'ติดตามสิทธิ์จัดส่งโดยไม่สร้างเกณฑ์ยอดซื้อขึ้นเอง'
				),
				copy(
					'an optimizer-provided shipping-eligibility progress contract',
					'ข้อมูลความคืบหน้าสิทธิ์จัดส่งจากระบบคำนวณราคา'
				)
			),
			moduleRecipe(
				'smart-basket-09',
				copy('Honest gap filler', 'สินค้าเพิ่มเพื่อครบเงื่อนไขอย่างตรงไปตรงมา'),
				'ready',
				'split',
				['products', 'price', 'voucher'],
				copy(
					'Inspect optional add-ons with their complete extra cost.',
					'ตรวจสินค้าเพิ่มแบบสมัครใจพร้อมค่าใช้จ่ายเพิ่มทั้งหมด'
				),
				copy(
					'existing optimizer add-on explanations with extra cost and no automatic addition',
					'คำอธิบายสินค้าเพิ่มจากระบบราคาเดิมพร้อมค่าใช้จ่ายเพิ่มและไม่มีการเพิ่มอัตโนมัติ'
				)
			),
			moduleRecipe(
				'smart-basket-10',
				copy('Compatible accessory', 'อุปกรณ์เสริมที่เข้ากันได้'),
				'service',
				'tiles',
				['products', 'specs', 'source'],
				copy(
					'Find an accessory with verified compatibility evidence.',
					'หาอุปกรณ์เสริมที่มีหลักฐานความเข้ากันได้'
				),
				copy(
					'verified compatibility relationships between selected products',
					'ข้อมูลความเข้ากันได้ที่ตรวจสอบแล้วระหว่างสินค้าที่เลือก'
				)
			),
			moduleRecipe(
				'smart-basket-11',
				copy('Complete-the-set', 'เลือกสินค้าให้ครบชุด'),
				'service',
				'tiles',
				['products', 'specs', 'source'],
				copy(
					'Identify evidenced missing components of a working set.',
					'ระบุชิ้นส่วนที่ขาดของชุดใช้งานจากหลักฐาน'
				),
				copy(
					'task requirements and verified complementary-product relationships',
					'ข้อกำหนดของงานและความสัมพันธ์สินค้าที่ใช้ร่วมกันซึ่งตรวจสอบได้'
				)
			),
			moduleRecipe(
				'smart-basket-12',
				copy('Complete-the-look', 'เลือกสินค้าให้เข้าลุค'),
				'service',
				'tiles',
				['photos', 'products', 'source'],
				copy(
					'Complete a coordinated look using supported style mappings.',
					'จัดลุคให้ครบจากข้อมูลความเข้าชุดที่รองรับ'
				),
				copy(
					'supported style relationships and complete outfit/set evidence',
					'ข้อมูลความเข้าชุดและหลักฐานองค์ประกอบของชุดครบถ้วน'
				)
			),
			moduleRecipe(
				'smart-basket-13',
				copy('Routine bundle', 'ชุดสินค้าตามกิจวัตร'),
				'service',
				'stack',
				['products', 'categories', 'source'],
				copy(
					'Build a routine from evidenced product relationships.',
					'จัดชุดกิจวัตรจากความสัมพันธ์สินค้าที่มีหลักฐาน'
				),
				copy(
					'verified routine membership and product suitability relationships',
					'ข้อมูลสินค้าที่อยู่ในกิจวัตรเดียวกันและความเหมาะสมที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'smart-basket-14',
				copy('Family pack', 'แพ็กสำหรับครอบครัว'),
				'service',
				'split',
				['products', 'price', 'specs'],
				copy(
					'Compare real pack sizes with clear quantity information.',
					'เทียบขนาดแพ็กจริงพร้อมข้อมูลจำนวนชัดเจน'
				),
				copy(
					'canonical pack variants, quantities and unit comparisons',
					'ตัวเลือกแพ็ก จำนวน และการเทียบต่อหน่วยจากแค็ตตาล็อก'
				)
			),
			moduleRecipe(
				'smart-basket-15',
				copy('Refill quantity', 'จำนวนรีฟิล'),
				'service',
				'rail',
				['products', 'specs', 'price'],
				copy(
					'Choose a compatible refill amount with known availability.',
					'เลือกจำนวนรีฟิลที่เข้ากันและทราบสถานะพร้อมขาย'
				),
				copy(
					'verified refill compatibility, quantities and current stock',
					'ข้อมูลความเข้ากันได้ของรีฟิล จำนวน และสต็อกปัจจุบัน'
				)
			),
			moduleRecipe(
				'smart-basket-16',
				copy('Budget guard', 'ตัวป้องกันเกินงบ'),
				'service',
				'receipt',
				['budget', 'price', 'source'],
				copy(
					'Enforce a declared total basket budget rather than a per-item ceiling.',
					'บังคับงบรวมตะกร้าที่ระบุแทนเพดานราคาต่อสินค้า'
				),
				copy(
					'a separately declared basket budget and enforced total-cost checks',
					'งบตะกร้าที่ระบุแยกต่างหากและการตรวจยอดรวมตามงบ'
				)
			),
			moduleRecipe(
				'smart-basket-17',
				copy('Remove/hide recommendation', 'นำคำแนะนำออกหรือซ่อน'),
				'service',
				'rail',
				['products', 'undo', 'preferences'],
				copy(
					'Dismiss a recommendation and reduce related future suggestions.',
					'ปิดคำแนะนำและลดข้อเสนอที่เกี่ยวข้องภายหลัง'
				),
				copy(
					'recommendation-dismissal state and a supported suppression policy',
					'สถานะปิดคำแนะนำและนโยบายลดคำแนะนำที่รองรับ'
				)
			),
			moduleRecipe(
				'smart-basket-18',
				copy('Save basket as a reusable set', 'บันทึกตะกร้าเป็นชุดใช้ซ้ำ'),
				'service',
				'stack',
				['saved', 'products'],
				copy(
					'Restore a named basket set across later shopping tasks.',
					'กู้คืนชุดตะกร้าที่ตั้งชื่อในงานซื้อครั้งต่อไป'
				),
				copy(
					'a reusable saved-basket schema and restore controls',
					'โครงสร้างตะกร้าที่บันทึกใช้ซ้ำและตัวควบคุมกู้คืน'
				)
			)
		]
	},
	{
		id: 'checkout-payment',
		title: copy('Checkout and payment', 'การชำระเงินและการจ่าย'),
		purpose: copy(
			'Distinguish simulated price review from unavailable transaction services.',
			'แยกการตรวจราคาจำลองจากบริการทำธุรกรรมที่ยังไม่พร้อม'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'checkout-payment-01',
				copy('Delivery address', 'ที่อยู่จัดส่ง'),
				'service',
				'stack',
				['shipping', 'source'],
				copy('Validate a real delivery destination before ordering.', 'ตรวจปลายทางส่งจริงก่อนสั่งซื้อ'),
				copy(
					'an authenticated delivery-address store and validation',
					'ที่เก็บที่อยู่จัดส่งที่ยืนยันบัญชีและระบบตรวจที่อยู่'
				)
			),
			moduleRecipe(
				'checkout-payment-02',
				copy('Send-to-someone-else', 'ส่งให้ผู้อื่น'),
				'service',
				'stack',
				['shipping', 'question'],
				copy(
					'Confirm recipient consent and delivery contact details.',
					'ยืนยันความยินยอมผู้รับและข้อมูลติดต่อจัดส่ง'
				),
				copy(
					'recipient/contact consent and validated delivery details',
					'ความยินยอมของผู้รับหรือผู้ติดต่อและข้อมูลส่งที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'checkout-payment-03',
				copy('Delivery-date selection', 'เลือกวันที่จัดส่ง'),
				'service',
				'tiles',
				['shipping', 'source'],
				copy('Select an actually available delivery date.', 'เลือกวันที่จัดส่งซึ่งพร้อมให้บริการจริง'),
				copy(
					'logistics estimates, destination and promised delivery dates',
					'ข้อมูลประมาณการขนส่ง ปลายทาง และวันที่จัดส่งที่ยืนยันได้'
				)
			),
			moduleRecipe(
				'checkout-payment-04',
				copy('Seller shipment grouping', 'แยกพัสดุตามผู้ขาย'),
				'service',
				'stack',
				['scope', 'shipping', 'orders'],
				copy(
					'Inspect actual fulfillment groups rather than catalog shop grouping.',
					'ตรวจกลุ่มจัดส่งจริงแทนการจัดกลุ่มร้านจากแค็ตตาล็อก'
				),
				copy(
					'a fulfillment service with actual seller shipment groups',
					'บริการจัดส่งพร้อมกลุ่มพัสดุจริงแยกตามร้าน'
				)
			),
			moduleRecipe(
				'checkout-payment-05',
				copy('Shipping method', 'วิธีจัดส่ง'),
				'service',
				'tiles',
				['shipping', 'price'],
				copy(
					'Choose an eligible carrier service with a quoted fee.',
					'เลือกบริการขนส่งที่มีสิทธิ์พร้อมค่าบริการที่เสนอจริง'
				),
				copy(
					'eligible carrier services and destination-specific quotes',
					'บริการขนส่งที่เลือกได้และราคาตามปลายทาง'
				)
			),
			moduleRecipe(
				'checkout-payment-06',
				copy('Voucher and Coin summary', 'สรุปโค้ดและเหรียญ'),
				'ready',
				'receipt',
				['voucher', 'price', 'source'],
				copy(
					'Read fixture voucher and simulated coin use in the pricing receipt.',
					'อ่านการใช้โค้ดตัวอย่างและเหรียญจำลองในใบคำนวณราคา'
				),
				copy(
					'the existing optimizer, canonical basket facts and shared simulated coin balance',
					'ระบบคำนวณราคาเดิม ข้อมูลตะกร้าจากแค็ตตาล็อก และยอดเหรียญจำลองร่วมกัน'
				)
			),
			moduleRecipe(
				'checkout-payment-07',
				copy('Final payable total', 'ยอดชำระสุดท้าย'),
				'ready',
				'receipt',
				['price', 'shipping', 'voucher'],
				copy(
					'Inspect the simulated payable total without placing an order.',
					'ตรวจยอดที่ต้องจ่ายจำลองโดยไม่ทำคำสั่งซื้อ'
				),
				copy(
					'the existing optimizer, canonical basket facts and shared simulated coin balance',
					'ระบบคำนวณราคาเดิม ข้อมูลตะกร้าจากแค็ตตาล็อก และยอดเหรียญจำลองร่วมกัน'
				)
			),
			moduleRecipe(
				'checkout-payment-08',
				copy('Payment selection', 'เลือกวิธีชำระเงิน'),
				'service',
				'tiles',
				['payment', 'source'],
				copy(
					'Choose an available payment method with real transaction terms.',
					'เลือกวิธีจ่ายที่พร้อมใช้พร้อมเงื่อนไขธุรกรรมจริง'
				),
				copy(
					'an authenticated payment provider and transaction state',
					'ผู้ให้บริการชำระเงินที่ยืนยันบัญชีและสถานะธุรกรรม'
				)
			),
			moduleRecipe(
				'checkout-payment-09',
				copy('COD option', 'ตัวเลือกเก็บเงินปลายทาง'),
				'service',
				'stack',
				['payment', 'shipping'],
				copy(
					'Confirm cash-on-delivery eligibility before selecting it.',
					'ยืนยันสิทธิ์เก็บเงินปลายทางก่อนเลือก'
				),
				copy(
					'seller/carrier cash-on-delivery eligibility and terms',
					'สิทธิ์และเงื่อนไขเก็บเงินปลายทางของร้านและขนส่ง'
				)
			),
			moduleRecipe(
				'checkout-payment-10',
				copy('Financing disclosure', 'เปิดเผยเงื่อนไขสินเชื่อ'),
				'service',
				'receipt',
				['payment', 'source'],
				copy(
					'Read neutral provider-backed financing terms before a choice.',
					'อ่านเงื่อนไขสินเชื่อจากผู้ให้บริการอย่างเป็นกลางก่อนเลือก'
				),
				copy(
					'provider-approved financing terms and complete fees',
					'เงื่อนไขสินเชื่อที่ผู้ให้บริการรับรองและค่าธรรมเนียมครบถ้วน'
				)
			),
			moduleRecipe(
				'checkout-payment-11',
				copy('Total financing cost', 'ต้นทุนสินเชื่อทั้งหมด'),
				'service',
				'receipt',
				['payment', 'price', 'source'],
				copy(
					'Inspect all financing costs from authoritative provider terms.',
					'ตรวจต้นทุนสินเชื่อทั้งหมดจากเงื่อนไขผู้ให้บริการ'
				),
				copy(
					'provider-approved financing terms and complete fees',
					'เงื่อนไขสินเชื่อที่ผู้ให้บริการรับรองและค่าธรรมเนียมครบถ้วน'
				)
			),
			moduleRecipe(
				'checkout-payment-12',
				copy('Invoice request', 'ขอใบกำกับหรือใบแจ้งหนี้'),
				'service',
				'stack',
				['orders', 'source'],
				copy(
					'Request supported seller invoicing with verified billing details.',
					'ขอเอกสารที่ร้านรองรับด้วยข้อมูลเรียกเก็บที่ตรวจสอบแล้ว'
				),
				copy(
					'seller invoicing support and validated billing details',
					'บริการออกใบกำกับของร้านและข้อมูลเรียกเก็บที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'checkout-payment-13',
				copy('Gift wrap/message', 'ห่อของขวัญหรือแนบข้อความ'),
				'service',
				'stack',
				['products', 'shipping', 'question'],
				copy(
					'Choose an actual gift service with explicit cost and instructions.',
					'เลือกบริการของขวัญจริงพร้อมค่าใช้จ่ายและคำสั่งชัดเจน'
				),
				copy(
					'seller gift-service availability, costs and validated instructions',
					'บริการของขวัญของร้าน ค่าใช้จ่าย และคำสั่งที่ตรวจสอบแล้ว'
				)
			),
			moduleRecipe(
				'checkout-payment-14',
				copy('Final order review', 'ตรวจคำสั่งซื้อครั้งสุดท้าย'),
				'service',
				'receipt',
				['orders', 'payment', 'shipping'],
				copy(
					'Review validated transaction details before committing an order.',
					'ตรวจข้อมูลธุรกรรมที่ยืนยันแล้วก่อนตกลงสั่งซื้อ'
				),
				copy(
					'transactional checkout, current stock and payment confirmation; local add-to-cart alone is available',
					'ระบบชำระเงิน สต็อกปัจจุบัน และการยืนยันการจ่าย โดยมีเพียงการเพิ่มตะกร้าในเครื่องที่ใช้ได้'
				)
			),
			moduleRecipe(
				'checkout-payment-15',
				copy('Order confirmation', 'ยืนยันคำสั่งซื้อ'),
				'service',
				'receipt',
				['orders', 'payment', 'source'],
				copy(
					'Receive confirmation only from a completed real order transaction.',
					'รับการยืนยันเฉพาะจากธุรกรรมคำสั่งซื้อจริงที่สำเร็จ'
				),
				copy(
					'an authenticated order service and real order status',
					'บริการคำสั่งซื้อที่ยืนยันบัญชีและสถานะคำสั่งซื้อจริง'
				)
			)
		]
	},
	{
		id: 'post-purchase',
		title: copy('Post-purchase and retention', 'หลังซื้อและการกลับมาใช้งาน'),
		purpose: copy(
			'Describe post-purchase help without inventing purchases or ownership.',
			'อธิบายความช่วยเหลือหลังซื้อโดยไม่สร้างการซื้อหรือการเป็นเจ้าของสมมติ'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'post-purchase-01',
				copy('Order tracking', 'ติดตามคำสั่งซื้อ'),
				'service',
				'stack',
				['orders', 'shipping'],
				copy(
					'Track actual purchase fulfillment after an order exists.',
					'ติดตามการจัดส่งจริงหลังมีคำสั่งซื้อ'
				),
				copy(
					'an authenticated order service and real order status',
					'บริการคำสั่งซื้อที่ยืนยันบัญชีและสถานะคำสั่งซื้อจริง'
				)
			),
			moduleRecipe(
				'post-purchase-02',
				copy('Delivery changes', 'เปลี่ยนรายละเอียดจัดส่ง'),
				'service',
				'stack',
				['orders', 'shipping'],
				copy(
					'Request a permitted delivery change through the logistics service.',
					'ขอเปลี่ยนข้อมูลส่งที่อนุญาตผ่านบริการขนส่ง'
				),
				copy(
					'a fulfillment service with actual seller shipment groups',
					'บริการจัดส่งพร้อมกลุ่มพัสดุจริงแยกตามร้าน'
				)
			),
			moduleRecipe(
				'post-purchase-03',
				copy('Problem reporting', 'รายงานปัญหา'),
				'service',
				'stack',
				['orders', 'question', 'source'],
				copy(
					'Open a genuine support case for an actual purchase.',
					'เปิดเรื่องช่วยเหลือจริงสำหรับสินค้าที่ซื้อ'
				),
				copy(
					'authenticated support cases and a dispute service',
					'เรื่องช่วยเหลือที่ยืนยันบัญชีและบริการข้อพิพาท'
				)
			),
			moduleRecipe(
				'post-purchase-04',
				copy('Return/refund', 'คืนสินค้าหรือคืนเงิน'),
				'service',
				'receipt',
				['orders', 'payment', 'source'],
				copy(
					'Inspect return eligibility and follow a real refund process.',
					'ตรวจสิทธิ์คืนและดำเนินการคืนเงินจริง'
				),
				copy(
					'actual seller warranty and return-policy terms; duration specs alone are insufficient',
					'เงื่อนไขรับประกันและคืนสินค้าจริงของร้าน โดยระยะประกันในสเปกอย่างเดียวไม่พอ'
				)
			),
			moduleRecipe(
				'post-purchase-05',
				copy('Confirm receipt', 'ยืนยันการรับสินค้า'),
				'service',
				'receipt',
				['orders', 'shipping'],
				copy(
					'Confirm receipt against an existing order record.',
					'ยืนยันรับสินค้าโดยอ้างบันทึกคำสั่งซื้อที่มีจริง'
				),
				copy(
					'an authenticated order service and real order status',
					'บริการคำสั่งซื้อที่ยืนยันบัญชีและสถานะคำสั่งซื้อจริง'
				)
			),
			moduleRecipe(
				'post-purchase-06',
				copy('Product setup guide', 'คู่มือติดตั้งสินค้า'),
				'service',
				'stack',
				['specs', 'source', 'question'],
				copy(
					'Follow verified setup instructions for the exact product.',
					'ทำตามวิธีติดตั้งที่ตรวจสอบแล้วสำหรับสินค้ารุ่นนั้น'
				),
				copy('product-specific verified setup instructions', 'วิธีติดตั้งที่ตรวจสอบแล้วเฉพาะสินค้า')
			),
			moduleRecipe(
				'post-purchase-07',
				copy('Usage guide', 'คู่มือการใช้งาน'),
				'service',
				'stack',
				['specs', 'source', 'question'],
				copy(
					'Read verified usage guidance without generating unsafe advice.',
					'อ่านวิธีใช้ที่ตรวจสอบแล้วโดยไม่สร้างคำแนะนำที่เสี่ยง'
				),
				copy(
					'product-specific verified usage and safety guidance',
					'วิธีใช้และคำแนะนำความปลอดภัยที่ตรวจสอบแล้วเฉพาะสินค้า'
				)
			),
			moduleRecipe(
				'post-purchase-08',
				copy('Warranty storage', 'เก็บเอกสารรับประกัน'),
				'service',
				'stack',
				['saved', 'source', 'orders'],
				copy(
					'Keep authenticated ownership and warranty documents.',
					'เก็บหลักฐานเป็นเจ้าของและเอกสารรับประกันที่ยืนยันแล้ว'
				),
				copy(
					'ownership evidence and authenticated warranty-document storage',
					'หลักฐานการเป็นเจ้าของและที่เก็บเอกสารรับประกันที่ยืนยันบัญชี'
				)
			),
			moduleRecipe(
				'post-purchase-09',
				copy('Ask about the product', 'ถามเกี่ยวกับสินค้า'),
				'ready',
				'focus',
				['question', 'specs', 'source'],
				copy(
					'Ask about supported listing facts with citations or a decline.',
					'ถามข้อเท็จจริงรายการที่รองรับพร้อมอ้างอิงหรือปฏิเสธยืนยัน'
				),
				copy(
					'the existing validated offline assistant and cite-or-decline boundary',
					'ผู้ช่วยออฟไลน์ที่ตรวจสอบข้อเสนอและขอบเขตอ้างอิงหรือปฏิเสธการยืนยัน'
				)
			),
			moduleRecipe(
				'post-purchase-10',
				copy('Review prompt', 'เชิญให้รีวิว'),
				'service',
				'stack',
				['review', 'orders'],
				copy('Invite a review only for a verified eligible purchase.', 'เชิญรีวิวเฉพาะการซื้อจริงที่มีสิทธิ์'),
				copy(
					'verified purchase eligibility and a review-submission service',
					'สิทธิ์รีวิวจากการซื้อจริงและบริการส่งรีวิว'
				)
			),
			moduleRecipe(
				'post-purchase-11',
				copy('Replenishment reminder', 'เตือนเติมของ'),
				'service',
				'rail',
				['saved', 'products'],
				copy(
					'Receive an explicitly requested and evidenced replenishment reminder.',
					'รับเตือนเติมของที่ขอเองและมีหลักฐานรองรับ'
				),
				copy(
					'explicit reminder consent, schedule and replenishment evidence',
					'ความยินยอมรับเตือน ตารางเวลา และหลักฐานความจำเป็นในการเติมสินค้า'
				)
			),
			moduleRecipe(
				'post-purchase-12',
				copy('Compatible refill', 'รีฟิลที่เข้ากันได้'),
				'service',
				'split',
				['products', 'specs', 'source'],
				copy('Find a refill verified to fit an owned product.', 'หารีฟิลที่ตรวจสอบแล้วว่าใช้กับสินค้าที่มีได้'),
				copy(
					'verified refill compatibility, quantities and current stock',
					'ข้อมูลความเข้ากันได้ของรีฟิล จำนวน และสต็อกปัจจุบัน'
				)
			),
			moduleRecipe(
				'post-purchase-13',
				copy('Save as regular purchase', 'บันทึกเป็นการซื้อประจำ'),
				'service',
				'stack',
				['saved', 'products', 'orders'],
				copy('Save a consented recurring purchase preference.', 'บันทึกความชอบซื้อประจำโดยผู้ใช้ยินยอม'),
				copy('a consented recurring-purchase preference store', 'ที่เก็บความชอบซื้อซ้ำที่ได้รับความยินยอม')
			),
			moduleRecipe(
				'post-purchase-14',
				copy('Share with family', 'แชร์กับครอบครัว'),
				'ready',
				'rail',
				['preferences', 'source'],
				copy(
					'Share the current presentation without exposing purchase or cart data.',
					'แชร์รูปแบบปัจจุบันโดยไม่เปิดเผยข้อมูลซื้อหรือตะกร้า'
				),
				copy(
					'existing presentation-only share links; no shared basket or purchase history',
					'ลิงก์แชร์รูปแบบการแสดงผลเดิม โดยไม่แชร์ตะกร้าหรือประวัติซื้อ'
				)
			),
			moduleRecipe(
				'post-purchase-15',
				copy('Turn recommendation learning off', 'ปิดการเรียนรู้คำแนะนำ'),
				'service',
				'receipt',
				['preferences', 'undo', 'source'],
				copy(
					'Control recommendation learning only if such a system exists.',
					'ควบคุมการเรียนรู้คำแนะนำเฉพาะเมื่อมีระบบดังกล่าว'
				),
				copy(
					'a defined recommendation-learning system and consent controls; no online learning is active',
					'ระบบเรียนรู้คำแนะนำที่กำหนดชัดและตัวควบคุมความยินยอม โดยไม่มีการเรียนรู้ออนไลน์ทำงานอยู่'
				)
			)
		]
	},
	{
		id: 'account-safety',
		title: copy(
			'Account, loyalty, safety, and accessibility',
			'บัญชี สิทธิประโยชน์ ความปลอดภัย และการเข้าถึง'
		),
		purpose: copy(
			'Keep local preferences distinct from authenticated account services.',
			'แยกความชอบในเครื่องจากบริการบัญชีที่ต้องยืนยันตัวตน'
		),
		dependency: copy(
			'Use each module’s declared source and availability; shared catalog fixtures remain in use until updated data arrives.',
			'ใช้แหล่งข้อมูลและสถานะที่แต่ละโมดูลระบุ โดยคงข้อมูลแค็ตตาล็อกตัวอย่างร่วมกันระหว่างรอฉบับใหม่'
		),
		recipes: [
			moduleRecipe(
				'account-safety-01',
				copy('Preference center', 'ศูนย์ตั้งค่าความชอบ'),
				'ready',
				'stack',
				['preferences', 'apply', 'undo'],
				copy(
					'Review and change explicit local presentation preferences.',
					'ตรวจและเปลี่ยนความชอบการแสดงผลในเครื่องที่เลือกเอง'
				),
				copy(
					'the current plan, explicit preference locks and Undo',
					'แผนปัจจุบัน การล็อกความชอบที่เลือก และการย้อนกลับ'
				)
			),
			moduleRecipe(
				'account-safety-02',
				copy('Recommendation controls', 'ตัวควบคุมคำแนะนำ'),
				'ready',
				'rail',
				['preferences', 'products', 'undo'],
				copy(
					'Adjust existing ranking and presentation controls explicitly.',
					'ปรับตัวควบคุมการเรียงและการแสดงผลเดิมด้วยตนเอง'
				),
				copy(
					'existing deterministic ranking terms and catalog score inputs',
					'เหตุผลการเรียงแบบกำหนดแน่นอนและคะแนนจากแค็ตตาล็อก'
				)
			),
			moduleRecipe(
				'account-safety-03',
				copy('Personalization explanation', 'คำอธิบายการปรับเฉพาะบุคคล'),
				'ready',
				'receipt',
				['preferences', 'source'],
				copy(
					'Understand which local proposal changed the current view.',
					'เข้าใจว่าข้อเสนอในเครื่องใดเปลี่ยนมุมมองปัจจุบัน'
				),
				copy(
					'existing plan differences and atomic Undo/Reset',
					'การเปรียบเทียบแผนและการย้อนกลับหรือคืนค่าแบบครั้งเดียว'
				)
			),
			moduleRecipe(
				'account-safety-04',
				copy('Clear session/profile', 'ล้างเซสชันหรือโปรไฟล์'),
				'service',
				'receipt',
				['preferences', 'undo', 'source'],
				copy(
					'Clear all declared session/profile data through a complete deletion contract.',
					'ล้างข้อมูลเซสชันหรือโปรไฟล์ตามข้อตกลงลบที่ครบถ้วน'
				),
				copy(
					'an atomic session/cart/conversation/profile deletion contract; plan Reset is narrower',
					'ข้อตกลงล้างเซสชัน ตะกร้า บทสนทนา และโปรไฟล์ร่วมกัน โดยการคืนค่าแผนมีขอบเขตแคบกว่า'
				)
			),
			moduleRecipe(
				'account-safety-05',
				copy('Membership status', 'สถานะสมาชิก'),
				'service',
				'receipt',
				['scope', 'source'],
				copy(
					'Inspect genuine membership status tied to an authenticated account.',
					'ตรวจสถานะสมาชิกจริงที่ผูกกับบัญชียืนยันแล้ว'
				),
				copy('authenticated membership and reward entitlements', 'สถานะสมาชิกที่ยืนยันบัญชีและสิทธิ์รางวัล')
			),
			moduleRecipe(
				'account-safety-06',
				copy('Coin balance', 'ยอดเหรียญ'),
				'ready',
				'receipt',
				['price', 'voucher', 'source'],
				copy(
					'Read the shared simulated coin balance without claiming a real wallet.',
					'อ่านยอดเหรียญจำลองร่วมกันโดยไม่อ้างว่าเป็นกระเป๋าจริง'
				),
				copy(
					'the existing shared simulated coin constant and optimizer; not a live account balance',
					'ค่าเหรียญจำลองร่วมกันและระบบราคาเดิม ไม่ใช่ยอดบัญชีจริง'
				)
			),
			moduleRecipe(
				'account-safety-07',
				copy('Voucher wallet', 'กระเป๋าโค้ดส่วนลด'),
				'service',
				'tiles',
				['voucher', 'source'],
				copy(
					'Inspect vouchers actually owned by the authenticated shopper.',
					'ตรวจโค้ดที่เป็นของผู้ใช้บัญชีนั้นจริง'
				),
				copy(
					'authenticated owned-voucher entitlements; catalog vouchers are not a wallet',
					'สิทธิ์โค้ดที่เป็นของบัญชีจริง โดยโค้ดในแค็ตตาล็อกไม่ใช่กระเป๋าโค้ด'
				)
			),
			moduleRecipe(
				'account-safety-08',
				copy('Saved sets', 'ชุดสินค้าที่บันทึก'),
				'service',
				'tiles',
				['saved', 'products'],
				copy(
					'Reopen a real named saved set with explicit restore controls.',
					'เปิดชุดสินค้าที่ตั้งชื่อและบันทึกจริงด้วยการกู้คืนที่เลือกเอง'
				),
				copy(
					'a reusable saved-set store and explicit restore controls',
					'ที่เก็บชุดสินค้าสำหรับใช้ซ้ำและตัวควบคุมกู้คืน'
				)
			),
			moduleRecipe(
				'account-safety-09',
				copy('Following/creator management', 'จัดการการติดตามและผู้สร้าง'),
				'service',
				'stack',
				['scope', 'saved'],
				copy(
					'Manage genuine following relationships and creator subscriptions.',
					'จัดการการติดตามและสมัครผู้สร้างที่มีจริง'
				),
				copy(
					'authenticated following relationships and creator management',
					'ข้อมูลติดตามที่ยืนยันบัญชีและการจัดการผู้สร้าง'
				)
			),
			moduleRecipe(
				'account-safety-10',
				copy('Notification controls', 'ตัวควบคุมการแจ้งเตือน'),
				'service',
				'stack',
				['preferences', 'source'],
				copy(
					'Choose notification channels only through a consented service.',
					'เลือกช่องทางแจ้งเตือนผ่านบริการที่ได้รับความยินยอม'
				),
				copy(
					'consented notification preferences and a delivery service',
					'ความชอบการแจ้งเตือนที่ยินยอมและบริการส่งแจ้งเตือน'
				)
			),
			moduleRecipe(
				'account-safety-11',
				copy('Security center', 'ศูนย์ความปลอดภัย'),
				'service',
				'receipt',
				['scope', 'source'],
				copy(
					'Manage authenticated account security and active sessions.',
					'จัดการความปลอดภัยบัญชีและเซสชันที่ยืนยันตัวตน'
				),
				copy(
					'authenticated account security/session-management services',
					'บริการความปลอดภัยบัญชีและการจัดการเซสชันที่ยืนยันบัญชี'
				)
			),
			moduleRecipe(
				'account-safety-12',
				copy('Payment management', 'จัดการการชำระเงิน'),
				'service',
				'stack',
				['payment', 'source'],
				copy(
					'Manage real payment instruments through an authenticated provider.',
					'จัดการเครื่องมือจ่ายเงินจริงผ่านผู้ให้บริการที่ยืนยันตัวตน'
				),
				copy(
					'an authenticated payment provider and transaction state',
					'ผู้ให้บริการชำระเงินที่ยืนยันบัญชีและสถานะธุรกรรม'
				)
			),
			moduleRecipe(
				'account-safety-13',
				copy('Language', 'ภาษา'),
				'ready',
				'rail',
				['preferences', 'apply'],
				copy(
					'Switch between the existing Thai and English interface copy.',
					'สลับข้อความส่วนติดต่อภาษาไทยและอังกฤษที่มีอยู่'
				),
				copy(
					'existing language/theme controls and reduced-motion styles',
					'ตัวควบคุมภาษาและธีมเดิมพร้อมรูปแบบลดการเคลื่อนไหว'
				)
			),
			moduleRecipe(
				'account-safety-14',
				copy('Large print/reduced motion', 'ตัวอักษรใหญ่และลดการเคลื่อนไหว'),
				'ready',
				'stack',
				['preferences', 'apply', 'undo'],
				copy(
					'Use the large-print theme and respect reduced-motion settings.',
					'ใช้ธีมตัวอักษรใหญ่และเคารพการตั้งค่าลดการเคลื่อนไหว'
				),
				copy(
					'existing language/theme controls and reduced-motion styles',
					'ตัวควบคุมภาษาและธีมเดิมพร้อมรูปแบบลดการเคลื่อนไหว'
				)
			),
			moduleRecipe(
				'account-safety-15',
				copy('Support and dispute history', 'ประวัติความช่วยเหลือและข้อพิพาท'),
				'service',
				'stack',
				['orders', 'question', 'source'],
				copy(
					'Inspect real support and dispute history for an authenticated account.',
					'ตรวจประวัติช่วยเหลือและข้อพิพาทจริงของบัญชียืนยันแล้ว'
				),
				copy(
					'authenticated support cases and a dispute service',
					'เรื่องช่วยเหลือที่ยืนยันบัญชีและบริการข้อพิพาท'
				)
			)
		]
	}
];

// Block-level dependency hints are not module availability. Read recipe.availability.
export const dependencies = new Set<Block>(['voucher', 'shipping', 'payment', 'orders', 'review']);
export const blockNames: Record<Block, Copy> = {
	search: copy('Shop search', 'ค้นหาในร้าน'),
	categories: copy('Product groups', 'กลุ่มสินค้า'),
	scope: copy('Shop identity', 'ข้อมูลร้าน'),
	preferences: copy('Reading preferences', 'ความชอบในการอ่าน'),
	products: copy('Listing information', 'ข้อมูลสินค้า'),
	photos: copy('Catalog images', 'ภาพจากแค็ตตาล็อก'),
	specs: copy('Catalog specs', 'สเปกจากแค็ตตาล็อก'),
	price: copy('Catalog price', 'ราคาจากแค็ตตาล็อก'),
	source: copy('Catalog source', 'ที่มาจากแค็ตตาล็อก'),
	question: copy('Choosing assistance', 'ตัวช่วยในการเลือก'),
	saved: copy('Saved selection', 'รายการที่บันทึก'),
	budget: copy('Price ceiling', 'เพดานราคา'),
	voucher: copy('Voucher eligibility', 'สิทธิ์ใช้โค้ด'),
	shipping: copy('Delivery terms', 'เงื่อนไขการจัดส่ง'),
	payment: copy('Payment unavailable', 'ยังไม่เปิดให้ชำระเงิน'),
	orders: copy('Order service unavailable', 'บริการคำสั่งซื้อยังไม่พร้อมใช้งาน'),
	review: copy('Buyer reviews', 'รีวิวผู้ซื้อ'),
	apply: copy('Review and Apply', 'ตรวจแล้วใช้มุมมอง'),
	undo: copy('Undo and Reset', 'ย้อนกลับและคืนค่า')
};
