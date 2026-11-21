let openedAt: number | undefined;

export function getStoreOpenedAt(): number {
	return (openedAt ??= Date.now());
}
