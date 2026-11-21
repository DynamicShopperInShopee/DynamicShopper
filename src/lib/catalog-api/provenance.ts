// The observation importer reads Thai Shopee listing pages and original image files.
function externalUrl(value: unknown): URL | null {
	if (
		typeof value !== 'string' ||
		value.length > 8192 ||
		Array.from(value).some((char) => char.charCodeAt(0) <= 32)
	)
		return null;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash
			? url
			: null;
	} catch {
		return null;
	}
}

export function isShopSource(value: unknown): value is string {
	const url = externalUrl(value);
	return url?.hostname === 'shopee.co.th' || url?.hostname === 'www.shopee.co.th';
}

export function isSnapshotSource(value: unknown): value is string {
	if (isShopSource(value)) return true;
	const url = externalUrl(value);
	return (
		url?.hostname === 'www.kaggle.com' && /^\/datasets\/[\w.-]+\/[\w.-]+\/?$/.test(url.pathname)
	);
}

export function isListingSource(value: unknown, id: string): value is string {
	if (!isShopSource(value)) return false;
	const path = new URL(value).pathname;
	const match = path.match(/^(?:\/product\/(\d+)\/(\d+)|\/[^/]+-i\.(\d+)\.(\d+))\/?$/);
	return !!match && `${match[1] ?? match[3]}.${match[2] ?? match[4]}` === id;
}

export function isImageSource(value: unknown): value is string {
	const url = externalUrl(value);
	return (
		!!url &&
		['down-th.img.susercontent.com', 'down-sg.img.susercontent.com'].includes(url.hostname) &&
		/^\/file\/[A-Za-z0-9._~-]+$/.test(url.pathname)
	);
}
