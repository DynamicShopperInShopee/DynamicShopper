import type { Localized, Product } from './types.ts';

const localized = (en: string, th: string): Localized => ({ en, th });

const wireless = localized('2.4GHz', '2.4 กิกะเฮิรตซ์');
const dualWireless = localized('2.4GHz + Bluetooth', '2.4 กิกะเฮิรตซ์ + บลูทูธ');
const hybridAnc = localized('Hybrid ANC', 'ตัดเสียงรบกวนแบบไฮบริด');
const noAnc = localized('No ANC', 'ไม่มีระบบตัดเสียงรบกวน');
const allSkin = localized('All skin', 'ทุกสภาพผิว');

function listing(
	id: Product['id'],
	category: Product['category'],
	shopId: Product['shopId'],
	en: string,
	th: string,
	details: Omit<Product, 'id' | 'category' | 'shopId' | 'name'>
): Product {
	return { id, category, shopId, name: localized(en, th), ...details };
}

export const products: readonly Product[] = [
	{
		id: 'cooker-one-button',
		category: 'rice-cooker',
		shopId: 'homekrua',
		name: localized('1.8L one-button electric rice cooker', 'หม้อหุงข้าวไฟฟ้าแบบปุ่มเดียว 1.8 ลิตร'),
		price: 690,
		originalPrice: 890,
		rating: 4.8,
		reviewCount: 2840,
		sold: 32000,
		shipping: 50,
		specs: { capacity: 1.8, power: 700, programs: 2, warranty: 2 },
		summary: localized(
			'A simple cooker with one button and a clear indicator.',
			'หม้อหุงข้าวปุ่มเดียว ใช้ง่าย มีไฟแสดงสถานะชัดเจน'
		),
		reviews: [
			localized('Mom uses it without help', 'แม่ใช้เองได้ ไม่ต้องคอยช่วย'),
			localized('The light makes it easy to tell when the rice is ready.', 'ดูไฟก็รู้ว่าข้าวสุกแล้ว')
		],
		tags: ['simple', 'one button', 'seniors', 'family'],
		scores: { performance: 0.7, durability: 0.82, design: 0.76, value: 0.94 }
	},
	listing(
		'nova-lite',
		'mouse',
		'gamerzone',
		'Nova Lite 62g wireless gaming mouse',
		'เมาส์เกมมิ่งไร้สาย Nova Lite 62 กรัม',
		{
			price: 1290,
			originalPrice: 1590,
			rating: 4.7,
			sold: 5200,
			reviewCount: 460,
			shipping: 40,
			specs: { dpi: 16000, weight: 62, battery: 70, pollingRate: 1000, connection: wireless },
			tags: ['gaming', 'wireless', 'lightweight'],
			scores: { performance: 0.78, durability: 0.77, design: 0.8, value: 0.84 },
			summary: localized('A lightweight mouse for quick movements.', 'เมาส์เบา ขยับได้คล่อง'),
			reviews: [
				localized('Quick to flick across the pad.', 'สะบัดเมาส์ได้คล่อง'),
				localized('The buttons feel crisp.', 'ปุ่มกดตอบสนองดี')
			]
		}
	),
	listing(
		'vortex-w',
		'mouse',
		'techhub',
		'Vortex W wireless mouse, 120h battery',
		'เมาส์ไร้สาย Vortex W แบตเตอรี่ 120 ชม.',
		{
			price: 1190,
			originalPrice: 1490,
			rating: 4.6,
			sold: 8100,
			reviewCount: 670,
			shipping: 0,
			specs: { dpi: 12000, weight: 85, battery: 120, pollingRate: 1000, connection: dualWireless },
			tags: ['wireless', 'battery', 'bluetooth'],
			scores: { performance: 0.72, durability: 0.82, design: 0.73, value: 0.9 },
			summary: localized(
				'A wireless mouse for shoppers who charge infrequently.',
				'เมาส์ไร้สายสำหรับคนที่ไม่อยากชาร์จบ่อย'
			),
			reviews: [
				localized('One charge a month is enough', 'ชาร์จเดือนละครั้งก็พอ'),
				localized('Easy to switch between my computers.', 'สลับใช้กับคอมแต่ละเครื่องได้ง่าย')
			]
		}
	),
	listing(
		'aero-x',
		'mouse',
		'gamerzone',
		'Aero X 58g ultralight gaming mouse',
		'เมาส์เกมมิ่งน้ำหนักเบาพิเศษ Aero X 58 กรัม',
		{
			price: 1450,
			rating: 4.8,
			sold: 3900,
			reviewCount: 350,
			shipping: 40,
			specs: { dpi: 26000, weight: 58, battery: 95, pollingRate: 4000, connection: wireless },
			tags: ['gaming', 'wireless', 'lightweight', 'battery'],
			scores: { performance: 0.93, durability: 0.84, design: 0.9, value: 0.87 },
			summary: localized(
				'An ultralight mouse with a responsive sensor.',
				'เมาส์เบาพิเศษ เซ็นเซอร์ตอบสนองไว'
			),
			reviews: [
				localized('Feels light even after a long session.', 'เล่นนานก็ยังรู้สึกว่าเมาส์เบา'),
				localized('Tracking feels steady when I move fast.', 'ลากเร็วแล้วเคอร์เซอร์ยังนิ่ง')
			]
		}
	),
	listing(
		'blaze-pro',
		'mouse',
		'techhub',
		'Blaze Pro RGB wireless gaming mouse',
		'เมาส์เกมมิ่งไร้สาย Blaze Pro พร้อมไฟ RGB',
		{
			price: 1890,
			originalPrice: 2290,
			rating: 4.7,
			sold: 2600,
			reviewCount: 220,
			shipping: 0,
			specs: { dpi: 25600, weight: 74, battery: 80, pollingRate: 2000, connection: dualWireless },
			tags: ['gaming', 'wireless', 'rgb'],
			scores: { performance: 0.88, durability: 0.81, design: 0.87, value: 0.75 },
			summary: localized('A wireless gaming mouse with RGB lighting.', 'เมาส์เกมมิ่งไร้สายพร้อมไฟ RGB'),
			reviews: [
				localized('The lights look good on my desk.', 'ไฟสวยเข้ากับโต๊ะ'),
				localized('The side buttons are easy to reach.', 'ปุ่มด้านข้างอยู่ในตำแหน่งกดง่าย')
			]
		}
	),
	listing(
		'titan-max',
		'mouse',
		'techhub',
		'Titan Max 30K sensor gaming mouse',
		'เมาส์เกมมิ่ง Titan Max เซ็นเซอร์ 30K',
		{
			price: 2490,
			rating: 4.9,
			sold: 1500,
			reviewCount: 130,
			shipping: 0,
			specs: { dpi: 30000, weight: 63, battery: 110, pollingRate: 8000, connection: wireless },
			tags: ['gaming', 'wireless', 'precision'],
			scores: { performance: 0.98, durability: 0.9, design: 0.85, value: 0.7 },
			summary: localized(
				'A gaming mouse built around precise tracking.',
				'เมาส์เกมมิ่งที่เน้นการติดตามแม่นยำ'
			),
			reviews: [
				localized('Small aim adjustments feel smooth.', 'ขยับเล็งนิดเดียวก็นุ่มนวล'),
				localized('The shell feels solid.', 'ตัวเมาส์จับแล้วแข็งแรง')
			]
		}
	),
	listing(
		'rogue-o',
		'mouse',
		'gamerzone',
		'Rogue O honeycomb gaming mouse 55g',
		'เมาส์เกมมิ่งรังผึ้ง Rogue O 55 กรัม',
		{
			price: 1690,
			originalPrice: 1990,
			rating: 4.5,
			sold: 1100,
			reviewCount: 96,
			shipping: 40,
			specs: { dpi: 19000, weight: 55, battery: 60, pollingRate: 1000, connection: wireless },
			tags: ['gaming', 'wireless', 'lightweight', 'honeycomb'],
			scores: { performance: 0.78, durability: 0.69, design: 0.89, value: 0.75 },
			summary: localized(
				'A lightweight mouse with an open honeycomb shell.',
				'เมาส์น้ำหนักเบา ตัวเครื่องลายรังผึ้ง'
			),
			reviews: [
				localized('The open shell keeps my hand comfortable.', 'ตัวเมาส์โปร่ง จับแล้วสบายมือ'),
				localized('It glides easily across my mat.', 'ลากบนแผ่นรองได้ลื่นดี')
			]
		}
	),
	listing(
		'ergo-g',
		'mouse',
		'techhub',
		'Ergo G ergonomic wireless mouse',
		'เมาส์ไร้สาย Ergo G ทรงรับมือ',
		{
			price: 1990,
			rating: 4.6,
			sold: 900,
			reviewCount: 84,
			shipping: 0,
			specs: { dpi: 8000, weight: 98, battery: 150, pollingRate: 1000, connection: dualWireless },
			tags: ['ergonomic', 'wireless', 'battery'],
			scores: { performance: 0.7, durability: 0.86, design: 0.91, value: 0.69 },
			summary: localized(
				'A contoured wireless mouse for long work sessions.',
				'เมาส์ไร้สายทรงรับมือสำหรับทำงานนาน ๆ'
			),
			reviews: [
				localized('The curve supports my palm.', 'ทรงโค้งรองรับฝ่ามือพอดี'),
				localized('I rarely reach for the charger.', 'ไม่ค่อยต้องหยิบสายมาชาร์จ')
			]
		}
	),
	listing(
		'pixel-mini',
		'mouse',
		'gamerzone',
		'Pixel Mini compact gaming mouse',
		'เมาส์เกมมิ่งขนาดกะทัดรัด Pixel Mini',
		{
			price: 1590,
			rating: 4.4,
			sold: 700,
			reviewCount: 57,
			shipping: 40,
			specs: { dpi: 12000, weight: 66, battery: 85, pollingRate: 1000, connection: wireless },
			tags: ['gaming', 'wireless', 'compact'],
			scores: { performance: 0.69, durability: 0.73, design: 0.78, value: 0.7 },
			summary: localized(
				'A compact gaming mouse for smaller hands.',
				'เมาส์เกมมิ่งขนาดเล็ก เหมาะกับมือเล็ก'
			),
			reviews: [
				localized('Fits my grip without stretching.', 'จับถนัด ไม่ต้องเหยียดนิ้ว'),
				localized('Fits in my laptop bag easily.', 'ใส่กระเป๋าโน้ตบุ๊กได้สบาย')
			]
		}
	),
	listing(
		'quietbuds-pro',
		'earbuds',
		'audiolab',
		'QuietBuds Pro ANC earbuds',
		'หูฟัง QuietBuds Pro พร้อมตัดเสียงรบกวน',
		{
			price: 2490,
			originalPrice: 3290,
			rating: 4.8,
			sold: 9800,
			reviewCount: 820,
			shipping: 0,
			specs: { battery: 36, noiseCancelling: hybridAnc, latency: 60, weight: 5 },
			tags: ['anc', 'travel', 'battery'],
			scores: { performance: 0.91, durability: 0.84, design: 0.88, value: 0.75 },
			summary: localized(
				'Earbuds with hybrid noise cancelling for busy commutes.',
				'หูฟังตัดเสียงรบกวนแบบไฮบริด เหมาะกับการเดินทาง'
			),
			reviews: [
				localized('The train sounds quieter with these on.', 'ใส่แล้วเสียงรถไฟเบาลง'),
				localized('The tips stay comfortable on my commute.', 'ใส่เดินทางแล้วไม่เจ็บหู')
			]
		}
	),
	listing(
		'playlite',
		'earbuds',
		'audiolab',
		'PlayLite low-latency gaming earbuds',
		'หูฟังเกมมิ่ง PlayLite ความหน่วงต่ำ',
		{
			price: 790,
			originalPrice: 1190,
			rating: 4.5,
			sold: 12400,
			reviewCount: 960,
			shipping: 30,
			specs: { battery: 30, noiseCancelling: noAnc, latency: 40, weight: 4 },
			tags: ['gaming', 'low latency', 'budget'],
			scores: { performance: 0.8, durability: 0.72, design: 0.72, value: 0.94 },
			summary: localized('Gaming earbuds tuned for quick audio cues.', 'หูฟังเกมมิ่งที่เน้นเสียงตอบสนองไว'),
			reviews: [
				localized('Game sounds keep up with the action.', 'เสียงในเกมตามจังหวะทัน'),
				localized('The buds barely weigh down my ears.', 'ใส่แล้วไม่รู้สึกหนักหู')
			]
		}
	),
	listing(
		'sportfit',
		'earbuds',
		'gamerzone',
		'SportFit IPX5 sweatproof earbuds',
		'หูฟัง SportFit กันเหงื่อ IPX5',
		{
			price: 990,
			rating: 4.4,
			sold: 4300,
			reviewCount: 350,
			shipping: 30,
			specs: { battery: 28, noiseCancelling: noAnc, latency: 80, weight: 6 },
			tags: ['sport', 'exercise', 'waterproof'],
			scores: { performance: 0.7, durability: 0.79, design: 0.78, value: 0.79 },
			summary: localized('Workout earbuds with a secure fit.', 'หูฟังสำหรับออกกำลังกาย กระชับหู'),
			reviews: [
				localized('They stay put when I jog.', 'วิ่งแล้วหูฟังยังอยู่กับที่'),
				localized('The controls are easy to find by touch.', 'คลำหาปุ่มกดได้ง่าย')
			]
		}
	),
	listing(
		'studio-x',
		'earbuds',
		'audiolab',
		'Studio X Hi-Res earbuds',
		'หูฟังเสียงความละเอียดสูง Studio X',
		{
			price: 3490,
			rating: 4.9,
			sold: 1400,
			reviewCount: 120,
			shipping: 0,
			specs: { battery: 32, noiseCancelling: hybridAnc, latency: 70, weight: 5.5 },
			tags: ['hi-res', 'anc', 'music'],
			scores: { performance: 0.97, durability: 0.89, design: 0.87, value: 0.67 },
			summary: localized(
				'Earbuds for listeners who want detailed sound.',
				'หูฟังสำหรับคนที่ชอบฟังรายละเอียดของเสียง'
			),
			reviews: [
				localized('I can pick out quiet instruments.', 'ได้ยินเครื่องดนตรีที่เล่นเบา ๆ ชัดดี'),
				localized('The case feels sturdy.', 'กล่องเก็บดูแข็งแรง')
			]
		}
	),
	listing(
		'dailymini',
		'earbuds',
		'techhub',
		'DailyMini tiny Bluetooth earbuds',
		'หูฟังบลูทูธขนาดจิ๋ว DailyMini',
		{
			price: 590,
			rating: 4.3,
			sold: 21000,
			reviewCount: 1700,
			shipping: 30,
			specs: { battery: 24, noiseCancelling: noAnc, latency: 90, weight: 3.5 },
			tags: ['compact', 'bluetooth', 'budget'],
			scores: { performance: 0.59, durability: 0.67, design: 0.81, value: 0.9 },
			summary: localized(
				'Pocket-sized Bluetooth earbuds for everyday listening.',
				'หูฟังบลูทูธขนาดพกพาสำหรับฟังทุกวัน'
			),
			reviews: [
				localized('The case slips into a small pocket.', 'กล่องใส่กระเป๋าเสื้อได้'),
				localized('Comfortable for short walks.', 'ใส่เดินเล่นแล้วสบายหู')
			]
		}
	),
	listing(
		'neo-anc',
		'earbuds',
		'techhub',
		'Neo ANC earbuds, 40h battery',
		'หูฟัง Neo ANC แบตเตอรี่ 40 ชม.',
		{
			price: 1590,
			originalPrice: 1990,
			rating: 4.6,
			sold: 6100,
			reviewCount: 485,
			shipping: 0,
			specs: { battery: 40, noiseCancelling: hybridAnc, latency: 75, weight: 5 },
			tags: ['anc', 'battery', 'travel'],
			scores: { performance: 0.82, durability: 0.79, design: 0.76, value: 0.86 },
			summary: localized(
				'Noise-cancelling earbuds with battery life for long days.',
				'หูฟังตัดเสียงรบกวน แบตเตอรี่อยู่ได้นาน'
			),
			reviews: [
				localized('I can leave the charger at home.', 'ออกบ้านได้โดยไม่ต้องพกที่ชาร์จ'),
				localized('Useful on my bus ride.', 'ช่วยลดเสียงตอนนั่งรถเมล์')
			]
		}
	),
	listing(
		'clearcall',
		'earbuds',
		'audiolab',
		'ClearCall earbuds with noise-reducing mic',
		'หูฟัง ClearCall พร้อมไมค์ลดเสียงรบกวน',
		{
			price: 1290,
			rating: 4.5,
			sold: 2200,
			reviewCount: 180,
			shipping: 30,
			specs: { battery: 26, noiseCancelling: noAnc, latency: 85, weight: 4.5 },
			tags: ['calls', 'microphone', 'work'],
			scores: { performance: 0.75, durability: 0.74, design: 0.73, value: 0.8 },
			summary: localized(
				'Earbuds with a noise-reducing microphone for calls.',
				'หูฟังพร้อมไมค์ลดเสียงรบกวนสำหรับคุยสาย'
			),
			reviews: [
				localized('Colleagues hear me clearly on calls.', 'เพื่อนร่วมงานได้ยินเสียงชัดตอนโทร'),
				localized('Easy to wear through meetings.', 'ใส่ประชุมได้สบาย')
			]
		}
	),
	listing(
		'slimcharge',
		'power-bank',
		'techhub',
		'SlimCharge 10000mAh slim power bank',
		'พาวเวอร์แบงก์บาง SlimCharge 10000 mAh',
		{
			price: 490,
			originalPrice: 690,
			rating: 4.7,
			sold: 25000,
			reviewCount: 1820,
			shipping: 0,
			specs: { capacity: 10000, output: 22.5, weight: 190 },
			tags: ['compact', 'travel', 'fast charging'],
			scores: { performance: 0.78, durability: 0.77, design: 0.86, value: 0.94 },
			summary: localized(
				'A slim power bank that fits beside your phone.',
				'พาวเวอร์แบงก์ทรงบาง พกคู่กับมือถือได้ง่าย'
			),
			reviews: [
				localized('It fits flat in my bag.', 'ใส่กระเป๋าแล้วไม่กินที่'),
				localized('My phone charges quickly enough for errands.', 'ชาร์จมือถือทันใช้ระหว่างออกไปทำธุระ')
			]
		}
	),
	listing(
		'fastpd',
		'power-bank',
		'techhub',
		'FastPD 20000mAh 65W laptop power bank',
		'พาวเวอร์แบงก์โน้ตบุ๊ก FastPD 20000 mAh 65 วัตต์',
		{
			price: 1490,
			originalPrice: 1890,
			rating: 4.8,
			sold: 7400,
			reviewCount: 650,
			shipping: 0,
			specs: { capacity: 20000, output: 65, weight: 420 },
			tags: ['laptop', 'usb-c', 'fast charging'],
			scores: { performance: 0.96, durability: 0.88, design: 0.77, value: 0.84 },
			summary: localized(
				'A power bank for laptops that charge over USB-C.',
				'พาวเวอร์แบงก์สำหรับโน้ตบุ๊กที่ชาร์จผ่าน USB-C'
			),
			reviews: [
				localized('Handy when the café has no open socket.', 'มีประโยชน์ตอนร้านกาแฟไม่มีปลั๊กว่าง'),
				localized('The housing feels solid in my bag.', 'ตัวเครื่องแข็งแรง พกใส่กระเป๋าได้มั่นใจ')
			]
		}
	),
	listing(
		'maggo',
		'power-bank',
		'gamerzone',
		'MagGo 5000mAh magnetic power bank',
		'พาวเวอร์แบงก์แม่เหล็ก MagGo 5000 mAh',
		{
			price: 790,
			rating: 4.4,
			sold: 3600,
			reviewCount: 285,
			shipping: 30,
			specs: { capacity: 5000, output: 15, weight: 125 },
			tags: ['magnetic', 'compact', 'lightweight'],
			scores: { performance: 0.62, durability: 0.74, design: 0.91, value: 0.73 },
			summary: localized(
				'A lightweight magnetic backup for compatible phones.',
				'แบตสำรองแม่เหล็กน้ำหนักเบาสำหรับมือถือที่รองรับ'
			),
			reviews: [
				localized('Easy to attach while walking.', 'เดินอยู่ก็แปะเข้ากับมือถือได้ง่าย'),
				localized('Small enough to keep in my pocket.', 'เล็กพอจะใส่กระเป๋ากางเกง')
			]
		}
	),
	listing(
		'megapower',
		'power-bank',
		'techhub',
		'MegaPower 30000mAh travel power bank',
		'พาวเวอร์แบงก์เดินทาง MegaPower 30000 mAh',
		{
			price: 1190,
			rating: 4.6,
			sold: 4100,
			reviewCount: 330,
			shipping: 0,
			specs: { capacity: 30000, output: 45, weight: 590 },
			tags: ['travel', 'high capacity', 'usb-c'],
			scores: { performance: 0.9, durability: 0.84, design: 0.68, value: 0.91 },
			summary: localized(
				'A high-capacity power bank for time away from outlets.',
				'พาวเวอร์แบงก์ความจุสูงสำหรับช่วงที่อยู่ไกลปลั๊ก'
			),
			reviews: [
				localized('Useful on a weekend away.', 'มีประโยชน์เวลาออกทริปสุดสัปดาห์'),
				localized('I pack it in my bag because it feels heavy.', 'รู้สึกหนัก เลยพกไว้ในกระเป๋า')
			]
		}
	),
	listing(
		'ecobank',
		'power-bank',
		'gamerzone',
		'EcoBank 10000mAh budget power bank',
		'พาวเวอร์แบงก์ราคาประหยัด EcoBank 10000 mAh',
		{
			price: 299,
			rating: 4.2,
			sold: 41000,
			reviewCount: 3400,
			shipping: 30,
			specs: { capacity: 10000, output: 10, weight: 230 },
			tags: ['budget', 'everyday'],
			scores: { performance: 0.51, durability: 0.65, design: 0.62, value: 0.95 },
			summary: localized(
				'An affordable backup for everyday phone charging.',
				'แบตสำรองราคาประหยัดสำหรับชาร์จมือถือทั่วไป'
			),
			reviews: [
				localized('Handy to leave in my day bag.', 'พกติดกระเป๋าประจำไว้ได้'),
				localized('Fine when I am in no hurry.', 'ใช้ได้ดีตอนที่ไม่ได้รีบ')
			]
		}
	),
	listing(
		'solartrek',
		'power-bank',
		'gamerzone',
		'SolarTrek 20000mAh solar waterproof power bank',
		'พาวเวอร์แบงก์กันน้ำพลังงานแสงอาทิตย์ SolarTrek 20000 mAh',
		{
			price: 890,
			rating: 4.3,
			sold: 1300,
			reviewCount: 105,
			shipping: 30,
			specs: { capacity: 20000, output: 18, weight: 380 },
			tags: ['outdoor', 'solar', 'waterproof'],
			scores: { performance: 0.68, durability: 0.81, design: 0.76, value: 0.82 },
			summary: localized(
				'An outdoor power bank with a built-in solar panel.',
				'พาวเวอร์แบงก์สำหรับกิจกรรมกลางแจ้ง มีแผงโซลาร์ในตัว'
			),
			reviews: [
				localized('I carry it on camping trips.', 'พกไปด้วยเวลาไปแคมป์'),
				localized('Easy to find in my gear bag.', 'หาเจอง่ายในกระเป๋าอุปกรณ์')
			]
		}
	),
	listing(
		'cooker-digital',
		'rice-cooker',
		'homekrua',
		'1.0L digital rice cooker with timer',
		'หม้อหุงข้าวดิจิทัลตั้งเวลาได้ 1.0 ลิตร',
		{
			price: 1290,
			rating: 4.7,
			sold: 9200,
			reviewCount: 760,
			shipping: 50,
			specs: { capacity: 1, power: 450, programs: 8, warranty: 3 },
			tags: ['timer', 'digital', 'compact'],
			scores: { performance: 0.81, durability: 0.85, design: 0.84, value: 0.76 },
			summary: localized(
				'A compact digital cooker with a timer for planned meals.',
				'หม้อหุงข้าวดิจิทัลขนาดกะทัดรัด ตั้งเวลาหุงล่วงหน้าได้'
			),
			reviews: [
				localized('I set it before dinner so the rice is ready on time.', 'ตั้งเวลาไว้ ข้าวสุกพอดีมื้อเย็น'),
				localized('The program names are easy to read.', 'อ่านชื่อโปรแกรมได้ชัด')
			]
		}
	),
	listing(
		'cooker-family',
		'rice-cooker',
		'homekrua',
		'2.2L family rice cooker, 3-year warranty',
		'หม้อหุงข้าวครอบครัว 2.2 ลิตร รับประกัน 3 ปี',
		{
			price: 1590,
			originalPrice: 1990,
			rating: 4.8,
			sold: 5300,
			reviewCount: 470,
			shipping: 0,
			specs: { capacity: 2.2, power: 900, programs: 4, warranty: 3 },
			tags: ['family', 'seniors', 'large buttons'],
			scores: { performance: 0.88, durability: 0.9, design: 0.8, value: 0.82 },
			summary: localized(
				'A family-sized cooker with large, easy-to-press buttons.',
				'หม้อหุงข้าวขนาดครอบครัว ปุ่มใหญ่กดง่าย'
			),
			reviews: [
				localized('Large buttons suit seniors', 'ปุ่มใหญ่เหมาะกับผู้สูงอายุ'),
				localized('There is room for rice when the family visits.', 'หุงข้าวพอเวลาลูกหลานมาบ้าน')
			]
		}
	),
	listing(
		'cooker-mini',
		'rice-cooker',
		'techhub',
		'0.8L mini rice cooker for 1-2 people',
		'หม้อหุงข้าวมินิ 0.8 ลิตร สำหรับ 1–2 คน',
		{
			price: 450,
			rating: 4.5,
			sold: 18000,
			reviewCount: 1520,
			shipping: 50,
			specs: { capacity: 0.8, power: 350, programs: 2, warranty: 1 },
			tags: ['compact', 'budget', 'simple'],
			scores: { performance: 0.63, durability: 0.7, design: 0.78, value: 0.89 },
			summary: localized(
				'A mini cooker for small portions and tight counters.',
				'หม้อหุงข้าวขนาดเล็ก เหมาะกับมื้อเล็กและครัวพื้นที่น้อย'
			),
			reviews: [
				localized('Fits in my small kitchen.', 'วางในครัวเล็กได้พอดี'),
				localized('It is easy to put away after dinner.', 'กินข้าวเสร็จแล้วยกเก็บง่าย')
			]
		}
	),
	listing(
		'cooker-ih',
		'rice-cooker',
		'techhub',
		'1.5L IH rice cooker, restaurant-quality rice',
		'หม้อหุงข้าว IH 1.5 ลิตร หุงข้าวสไตล์ร้านอาหาร',
		{
			price: 3290,
			originalPrice: 3990,
			rating: 4.9,
			sold: 1800,
			reviewCount: 160,
			shipping: 0,
			specs: { capacity: 1.5, power: 1000, programs: 12, warranty: 5 },
			tags: ['induction', 'digital', 'premium'],
			scores: { performance: 0.98, durability: 0.95, design: 0.9, value: 0.65 },
			summary: localized(
				'An induction cooker with programs for different grains.',
				'หม้อหุงข้าวระบบเหนี่ยวนำ มีโปรแกรมสำหรับข้าวหลายชนิด'
			),
			reviews: [
				localized('The rice comes out evenly cooked.', 'ข้าวสุกทั่วหม้อสม่ำเสมอ'),
				localized('I use the grain programs often.', 'ได้ใช้โปรแกรมหุงข้าวแต่ละชนิดบ่อย')
			]
		}
	),
	listing(
		'cooker-steamer',
		'rice-cooker',
		'homekrua',
		'1.8L rice cooker with steamer tray',
		'หม้อหุงข้าว 1.8 ลิตร พร้อมถาดนึ่ง',
		{
			price: 890,
			rating: 4.6,
			sold: 11000,
			reviewCount: 890,
			shipping: 50,
			specs: { capacity: 1.8, power: 750, programs: 3, warranty: 2 },
			tags: ['steamer', 'family', 'simple'],
			scores: { performance: 0.79, durability: 0.8, design: 0.74, value: 0.88 },
			summary: localized(
				'A rice cooker with a tray for steaming vegetables.',
				'หม้อหุงข้าวพร้อมถาดสำหรับนึ่งผัก'
			),
			reviews: [
				localized('I steam vegetables while the rice cooks.', 'นึ่งผักได้ระหว่างหุงข้าว'),
				localized('The tray rinses clean easily.', 'ถาดนึ่งล้างง่าย')
			]
		}
	),
	listing(
		'sunscreen-spf50',
		'skincare',
		'glow-skin',
		'SPF50+ PA++++ lightweight sunscreen',
		'กันแดดเนื้อบางเบา SPF50+ PA++++',
		{
			price: 359,
			originalPrice: 490,
			rating: 4.8,
			sold: 56000,
			reviewCount: 5200,
			shipping: 0,
			specs: { volume: 50, spf: 50, skinType: allSkin },
			tags: ['sunscreen', 'lightweight', 'daily'],
			scores: { performance: 0.92, durability: 0.79, design: 0.87, value: 0.93 },
			summary: localized(
				'A lightweight daily sunscreen for all skin types.',
				'กันแดดเนื้อบางเบาสำหรับใช้ทุกวัน ใช้ได้ทุกสภาพผิว'
			),
			reviews: [
				localized('Feels light under makeup.', 'ทาแล้วไม่หนักหน้าก่อนแต่งหน้า'),
				localized('It spreads without much rubbing.', 'เกลี่ยง่าย ไม่ต้องถูนาน')
			]
		}
	),
	listing(
		'vitamin-c-serum',
		'skincare',
		'glow-skin',
		'15% Vitamin C brightening serum',
		'เซรั่มวิตามินซี 15% เพื่อผิวดูกระจ่างใส',
		{
			price: 590,
			rating: 4.7,
			sold: 24000,
			reviewCount: 2260,
			shipping: 0,
			specs: { volume: 30, spf: 0, skinType: allSkin },
			tags: ['serum', 'vitamin c', 'brightening'],
			scores: { performance: 0.88, durability: 0.76, design: 0.83, value: 0.8 },
			summary: localized('A vitamin C serum with a light texture.', 'เซรั่มวิตามินซีเนื้อบางเบา'),
			reviews: [
				localized('The texture layers well with my moisturiser.', 'ทาต่อด้วยมอยส์เจอไรเซอร์ได้ ไม่เป็นขุย'),
				localized('The dropper makes it easy to dispense.', 'หลอดหยดใช้ง่าย')
			]
		}
	),
	listing(
		'oil-control-gel',
		'skincare',
		'glow-skin',
		'Oil-control cleansing gel for oily, acne-prone skin',
		'เจลล้างหน้าคุมมันสำหรับผิวมันเป็นสิวง่าย',
		{
			price: 189,
			rating: 4.6,
			sold: 38000,
			reviewCount: 3160,
			shipping: 30,
			specs: { volume: 150, spf: 0, skinType: localized('Oily', 'ผิวมัน') },
			tags: ['cleanser', 'oily skin', 'oil control'],
			scores: { performance: 0.79, durability: 0.77, design: 0.73, value: 0.96 },
			summary: localized(
				'A cleansing gel for oily, acne-prone skin.',
				'เจลทำความสะอาดใบหน้าสำหรับผิวมันเป็นสิวง่าย'
			),
			reviews: [
				localized('The gel rinses off easily.', 'ล้างเจลออกง่าย'),
				localized('My face feels fresh after washing.', 'ล้างแล้วรู้สึกหน้าสะอาดสดชื่น')
			]
		}
	),
	listing(
		'ceramide-moisturiser',
		'skincare',
		'glow-skin',
		'Ceramide moisturiser for dry skin, 24h hydration',
		'มอยส์เจอไรเซอร์เซราไมด์สำหรับผิวแห้ง ชุ่มชื้น 24 ชม.',
		{
			price: 450,
			originalPrice: 590,
			rating: 4.7,
			sold: 15000,
			reviewCount: 1370,
			shipping: 30,
			specs: { volume: 75, spf: 0, skinType: localized('Dry', 'ผิวแห้ง') },
			tags: ['moisturiser', 'dry skin', 'ceramide'],
			scores: { performance: 0.85, durability: 0.84, design: 0.82, value: 0.86 },
			summary: localized(
				'A moisturiser with ceramides for dry skin.',
				'มอยส์เจอไรเซอร์ผสมเซราไมด์สำหรับผิวแห้ง'
			),
			reviews: [
				localized('My cheeks feel less tight after applying it.', 'ทาแล้วแก้มรู้สึกตึงน้อยลง'),
				localized('I like the texture at night.', 'ชอบเนื้อครีมตอนทาก่อนนอน')
			]
		}
	),
	listing(
		'sunscreen-spf35',
		'skincare',
		'glow-skin',
		'SPF35 gentle sunscreen for sensitive skin',
		'กันแดดสูตรอ่อนโยน SPF35 สำหรับผิวแพ้ง่าย',
		{
			price: 420,
			rating: 4.7,
			sold: 9000,
			reviewCount: 780,
			shipping: 30,
			specs: { volume: 40, spf: 35, skinType: localized('Sensitive', 'ผิวแพ้ง่าย') },
			tags: ['sunscreen', 'sensitive skin', 'gentle'],
			scores: { performance: 0.84, durability: 0.76, design: 0.84, value: 0.79 },
			summary: localized(
				'A gentle sunscreen designed for sensitive skin.',
				'กันแดดสูตรอ่อนโยนสำหรับผิวแพ้ง่าย'
			),
			reviews: [
				localized('The cream feels comfortable on my skin.', 'ทาแล้วรู้สึกสบายผิว'),
				localized('Easy to carry in my handbag.', 'ใส่กระเป๋าถือพกง่าย')
			]
		}
	),
	listing(
		'hyaluronic-masks',
		'skincare',
		'glow-skin',
		'Hyaluronic sheet masks, 10 pack',
		'มาสก์แผ่นไฮยาลูรอน แพ็ก 10 แผ่น',
		{
			price: 249,
			originalPrice: 349,
			rating: 4.5,
			sold: 29000,
			reviewCount: 2520,
			shipping: 30,
			specs: { volume: 250, spf: 0, skinType: allSkin },
			tags: ['sheet mask', 'hydration', 'hyaluronic acid'],
			scores: { performance: 0.75, durability: 0.69, design: 0.8, value: 0.92 },
			summary: localized(
				'Hyaluronic sheet masks for a hydrating routine.',
				'มาสก์แผ่นไฮยาลูรอนสำหรับเติมความชุ่มชื้น'
			),
			reviews: [
				localized('The sheet sits well on my face.', 'แผ่นมาสก์แนบหน้าดี'),
				localized('My skin feels soft after using it.', 'ใช้แล้วรู้สึกว่าผิวนุ่ม')
			]
		}
	)
];

const productsById = new Map(products.map((product) => [product.id, product]));

export function getProduct(id: string): Product | undefined {
	return productsById.get(id);
}
