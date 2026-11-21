type Validate<T> = (input: unknown) => T | undefined;
type StoreStorage = Pick<Storage, 'getItem' | 'setItem'>;

interface SavedStore<Plan, Cart> {
	plan?: Plan;
	cart?: Cart;
}

const savedStoreKey = 'dynamicshopper.store.v1';
const maxSavedLength = 16_384;
const maxLookLength = 2_048;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safelyValidate<T>(input: unknown, validate: Validate<T>): T | undefined {
	try {
		return validate(input);
	} catch {
		return undefined;
	}
}

function validatedStore<Plan, Cart>(
	value: Record<string, unknown>,
	validatePlan: Validate<Plan>,
	validateCart: Validate<Cart>
): SavedStore<Plan, Cart> {
	const plan = safelyValidate(value.plan, validatePlan);
	const cart = safelyValidate(value.cart, validateCart);
	return {
		...(plan === undefined ? {} : { plan }),
		...(cart === undefined ? {} : { cart })
	};
}

export function readSavedStore<Plan, Cart>(
	storage: StoreStorage,
	validatePlan: Validate<Plan>,
	validateCart: Validate<Cart>
): SavedStore<Plan, Cart> {
	try {
		const saved = storage.getItem(savedStoreKey);
		if (!saved || saved.length > maxSavedLength) return {};
		const value: unknown = JSON.parse(saved);
		return isRecord(value) ? validatedStore(value, validatePlan, validateCart) : {};
	} catch {
		return {};
	}
}

export function writeSavedStore<Plan, Cart>(
	storage: StoreStorage,
	value: { plan?: unknown; cart?: unknown },
	validatePlan: Validate<Plan>,
	validateCart: Validate<Cart>
): boolean {
	try {
		const saved = JSON.stringify(validatedStore(value, validatePlan, validateCart));
		if (saved.length > maxSavedLength) return false;
		storage.setItem(savedStoreKey, saved);
		return true;
	} catch {
		return false;
	}
}

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function encodeSharedLook(
	plan: Record<string, unknown>,
	presentationFields: readonly string[]
): string | undefined {
	try {
		const look = Object.fromEntries(
			presentationFields
				.filter((field) => Object.hasOwn(plan, field))
				.map((field) => [field, plan[field]])
		);
		if (!Object.keys(look).length) return undefined;
		const json = JSON.stringify(look);
		if (json.length > maxLookLength) return undefined;
		const token = toBase64Url(new TextEncoder().encode(json));
		return token.length <= maxLookLength ? token : undefined;
	} catch {
		return undefined;
	}
}

export function parseSharedLook<Look>(
	token: string,
	presentationFields: readonly string[],
	validate: Validate<Look>
): Look | undefined {
	if (!token || token.length > maxLookLength || !/^[A-Za-z0-9_-]+$/.test(token)) return undefined;

	try {
		const binary = atob(token.replaceAll('-', '+').replaceAll('_', '/'));
		const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
		if (toBase64Url(bytes) !== token) return undefined;
		const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
		const value: unknown = JSON.parse(json);
		if (!isRecord(value)) return undefined;

		const fields = Object.keys(value);
		if (!fields.length || fields.some((field) => !presentationFields.includes(field)))
			return undefined;
		return safelyValidate(value, validate);
	} catch {
		return undefined;
	}
}
