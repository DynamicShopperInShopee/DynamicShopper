/** Catalog facts are supplied by the backend. Presentation plans never own them. */
export type LocalizedText = Readonly<{ en: string; th: string }>;

export type ShopListing = Readonly<{
	id: string;
	name: LocalizedText;
	category: string;
	price: number | null;
	currency: 'THB';
	image: string | null;
	source: string;
	size: LocalizedText | null;
	sellerName?: string | null;
	observedAt?: string | null;
	collectedAt?: string;
	priceSource?: string | null;
	imageSource?: string | null;
	sourceLabel?: LocalizedText;
}>;

export type CatalogCategory = Readonly<{
	id: string;
	name: LocalizedText;
	count: number;
}>;

export type CatalogSnapshotInfo = Readonly<{
	id: string;
	source: string;
	observedAt: string | null;
	importedAt: string;
	total: number;
	license?: string;
}>;

export type CatalogSnapshot = Readonly<{
	items: readonly ShopListing[];
	categories: readonly CatalogCategory[];
	snapshot: CatalogSnapshotInfo;
}>;

export type CatalogPage = CatalogSnapshot &
	Readonly<{
		total: number;
		page: number;
		pageSize: number;
	}>;
