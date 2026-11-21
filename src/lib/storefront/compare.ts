export const comparePresets = ['tech', 'visual', 'mom'] as const;
export type ComparePreset = (typeof comparePresets)[number];

export const presets = {
	tech: {
		label: { en: 'Tech minimal', th: 'สายเทคแบบเรียบง่าย' },
		layout: 'table',
		theme: 'minimal'
	},
	visual: {
		label: { en: 'Visual vibrant', th: 'เน้นภาพสีสด' },
		layout: 'grid',
		theme: 'vibrant'
	},
	mom: {
		label: { en: 'Mom mode', th: 'โหมดสำหรับแม่' },
		layout: 'large-print',
		theme: 'large-print'
	}
} as const;
