export const comparePresets = ['standard', 'tech', 'visual', 'mom'] as const;
export type ComparePreset = (typeof comparePresets)[number];

export const presetLabels = {
	standard: { en: 'Standard', th: 'มาตรฐาน' },
	tech: { en: 'Tech minimal', th: 'สายเทคแบบเรียบง่าย' },
	visual: { en: 'Visual vibrant', th: 'เน้นภาพสีสด' },
	mom: { en: 'Mom mode', th: 'โหมดสำหรับแม่' }
} as const;
