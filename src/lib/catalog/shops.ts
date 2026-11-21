import type { Category, Localized, ShopId } from './types.ts';

export type Shop = Readonly<{
	id: ShopId;
	name: Localized;
	mall: boolean;
	rating: number;
	categories: readonly Category[];
}>;

export const shops: readonly Shop[] = [
	{
		id: 'techhub',
		name: { en: 'TechHub Official Store', th: 'ร้านทางการ TechHub' },
		mall: true,
		rating: 4.9,
		categories: ['mouse', 'earbuds', 'power-bank', 'rice-cooker']
	},
	{
		id: 'gamerzone',
		name: { en: 'GamerZone Thailand', th: 'GamerZone ไทย' },
		mall: false,
		rating: 4.7,
		categories: ['mouse', 'earbuds', 'power-bank']
	},
	{
		id: 'audiolab',
		name: { en: 'AudioLab Mall', th: 'AudioLab Mall' },
		mall: true,
		rating: 4.8,
		categories: ['earbuds']
	},
	{
		id: 'homekrua',
		name: { en: 'บ้านครัว HomeKrua', th: 'บ้านครัว HomeKrua' },
		mall: false,
		rating: 4.8,
		categories: ['rice-cooker']
	},
	{
		id: 'glow-skin',
		name: { en: 'Glow Skin Official', th: 'ร้านทางการ Glow Skin' },
		mall: true,
		rating: 4.9,
		categories: ['skincare']
	}
];

export function getShop(id: string): Shop | undefined {
	return shops.find((shop) => shop.id === id);
}
