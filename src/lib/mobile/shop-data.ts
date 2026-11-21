import type { ShopListing } from '../catalog-api/types';
export type { ShopListing } from '../catalog-api/types';
import breeze from '../assets/shop/breeze.jpg';
import sunlightLemon from '../assets/shop/sunlight-lemon.jpg';
import sunlightMultipack from '../assets/shop/sunlight-multipack.jpg';
import breezeQuickwash from '../assets/shop/breeze-quickwash.jpg';
import breezeGold from '../assets/shop/breeze-gold.jpg';
import breezePureHappy from '../assets/shop/breeze-purehappy.jpg';
import breezeGallon from '../assets/shop/breeze-gallon.jpg';

export const shopSource = 'https://shopee.co.th/shop/58418206';
export const retrieved = '2026-11-21';
const breezeSearchSource = 'https://shopee.co.th/list/บรีส';
const sourceLabel = {
	en: 'Saved Shopee listing price; confirm the variant and current terms at source.',
	th: 'ราคาจากรายการ Shopee ที่บันทึกไว้ ตรวจสอบตัวเลือกและเงื่อนไขปัจจุบันที่ต้นทาง'
};
// Public cached Shopee shop/search observations retrieved on the date above.
// Search-card amounts can refer to a different selected variant from a product
// page. Keep those observations intact; never derive a universal checkout price.
// Photos are original listing gallery images, selected to exclude dated sale
// banners. Sizes retain each listing's range; they are not normalized or summed.
const provenance = {
	currency: 'THB' as const,
	sellerName: 'unilever_householdcare',
	observedAt: retrieved,
	sourceLabel
};
export const listings: readonly ShopListing[] = [
	{
		...provenance,
		id: '58418206.41776476003',
		name: { en: 'Breeze Matic detergent', th: 'บรีส เมติก ผงซักฟอก' },
		category: 'laundry',
		price: 475,
		image: breeze,
		source: 'https://shopee.co.th/product/58418206/41776476003',
		priceSource: shopSource,
		imageSource: 'https://down-th.img.susercontent.com/file/th-11134207-81zto-mh6rw0c4qej18b',
		size: { en: '7,500 g · Standard formula', th: '7,500 กรัม · สูตรมาตรฐาน' }
	},
	{
		...provenance,
		id: '58418206.54301508830',
		name: { en: 'Sunlight Lemon dishwashing liquid', th: 'ซันไลต์ น้ำยาล้างจาน เลมอน' },
		category: 'dishes',
		price: 978,
		image: sunlightLemon,
		source: 'https://shopee.co.th/product/58418206/54301508830',
		priceSource: shopSource,
		imageSource: 'https://down-th.img.susercontent.com/file/th-11134207-81ztk-mo9sxog4err500',
		size: { en: '10–20 L · Listing range', th: '10–20 ลิตร · ช่วงขนาดในรายการ' }
	},
	{
		...provenance,
		id: '58418206.42908480312',
		name: { en: 'Breeze Quick Wash laundry liquid', th: 'บรีส น้ำยาซักผ้าสูตรซักด่วน' },
		category: 'laundry',
		price: 259,
		image: breezeQuickwash,
		source: 'https://shopee.co.th/product/58418206/42908480312',
		priceSource: breezeSearchSource,
		imageSource: 'https://down-th.img.susercontent.com/file/th-11134207-81zth-mommryabm70uf9',
		size: {
			en: '1,100 ml × 2 or × 6 · Listing options',
			th: '1,100 มล. × 2 หรือ × 6 · ตัวเลือกในรายการ'
		}
	},
	{
		...provenance,
		id: '58418206.10482842392',
		name: { en: 'Sunlight dishwashing liquid multipack', th: 'ซันไลต์ น้ำยาล้างจาน แพ็กยกลัง' },
		category: 'dishes',
		price: 676,
		image: sunlightMultipack,
		source: 'https://shopee.co.th/product/58418206/10482842392',
		priceSource: 'https://shopee.co.th/unilever_householdcare?entryPoint=ShopByPDP',
		imageSource: 'https://down-th.img.susercontent.com/file/th-11134207-7rasg-m4pspfoc9ql045',
		size: { en: '2,800 ml × 4 · Packaging changing', th: '2,800 มล. × 4 · อยู่ระหว่างเปลี่ยนแพ็กเกจ' }
	},
	{
		...provenance,
		id: '58418206.13622158377',
		name: { en: 'Breeze Excel Gold front-load detergent', th: 'บรีส เอกเซล โกลด์ น้ำยาซักผ้าฝาหน้า' },
		category: 'laundry',
		price: 419,
		image: breezeGold,
		source: 'https://shopee.co.th/product/58418206/13622158377',
		priceSource: breezeSearchSource,
		imageSource: 'https://down-th.img.susercontent.com/file/th-11134207-81ztc-mnegbt1kk0lg3f',
		size: { en: '1,500 ml · 1+1 pack', th: '1,500 มล. · แพ็ก 1+1' }
	},
	{
		...provenance,
		id: '58418206.58006302772',
		name: { en: 'Breeze & Comfort Pure Happy set', th: 'บรีส และคอมฟอร์ท เพียว แฮปปี้ เซ็ตคู่' },
		category: 'laundry',
		price: 199,
		image: breezePureHappy,
		source: 'https://shopee.co.th/product/58418206/58006302772',
		priceSource: breezeSearchSource,
		imageSource: 'https://down-th.img.susercontent.com/file/th-11134207-81ztk-mnmlmmxm4gsoc2',
		size: {
			en: 'Detergent 1,100–1,200 ml + softener 1,050 ml',
			th: 'น้ำยาซักผ้า 1,100–1,200 มล. + ปรับผ้านุ่ม 1,050 มล.'
		}
	},
	{
		...provenance,
		id: '58418206.42226467434',
		name: { en: 'Breeze liquid detergent gallon', th: 'บรีส ผลิตภัณฑ์ซักผ้าชนิดน้ำ แกลลอน' },
		category: 'laundry',
		price: 299,
		image: breezeGallon,
		source: 'https://shopee.co.th/product/58418206/42226467434',
		priceSource: breezeSearchSource,
		imageSource: 'https://down-th.img.susercontent.com/file/th-11134207-81ztg-mh6r8ukhdk3x50',
		size: { en: '3.2–3.4 L · Listing options', th: '3.2–3.4 ลิตร · ตัวเลือกในรายการ' }
	}
];
export const breezePromotion = {
	price: 385,
	originalPrice: 499,
	eligibility: {
		en: 'New customers; selected variant and eligibility must be checked on Shopee.',
		th: 'สำหรับลูกค้าใหม่ ต้องตรวจสอบตัวเลือกและสิทธิ์ที่ Shopee'
	}
};
