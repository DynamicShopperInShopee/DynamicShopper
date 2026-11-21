import { expect, it } from 'vitest';
import { encodeSharedLook, parseSharedLook, readSavedStore, writeSavedStore } from './browserState';

const keys = ['theme', 'language'] as const;
const parsePlan = (value: unknown) => {
	if (typeof value !== 'object' || value === null) return;
	const { theme, language } = value as Record<string, unknown>;
	return theme === 'large-print' && language === 'th' ? { theme, language } : undefined;
};
const parseCart = (value: unknown) =>
	Array.isArray(value) ? value.filter((id): id is string => id === 'cooker-one-button') : undefined;

it('shares only the declared presentation fields and rejects malformed or oversized links', () => {
	const plan = {
		theme: 'large-print',
		language: 'th',
		search: 'private',
		cart: ['cooker-one-button']
	};
	const token = encodeSharedLook(plan, keys);
	expect(token).toBeTruthy();
	expect(parseSharedLook(token!, keys, parsePlan)).toEqual({
		theme: 'large-print',
		language: 'th'
	});
	expect(parseSharedLook('%%%', keys, parsePlan)).toBeUndefined();
	expect(parseSharedLook('a'.repeat(20_000), keys, parsePlan)).toBeUndefined();
	const injected = btoa(JSON.stringify({ ...plan, text: 'injected' })).replace(/=+$/, '');
	expect(parseSharedLook(injected, keys, parsePlan)).toBeUndefined();
});

it('restores plan and cart separately and saves only validated parts', () => {
	let stored = '';
	const storage = {
		getItem: () => stored,
		setItem: (_key: string, value: string) => {
			stored = value;
		}
	};
	const plan = { theme: 'large-print', language: 'th' };
	const cart = ['cooker-one-button'];
	expect(writeSavedStore(storage, { plan, cart }, parsePlan, parseCart)).toBe(true);
	expect(JSON.parse(stored)).toEqual({ plan, cart });
	expect(readSavedStore(storage, parsePlan, parseCart)).toEqual({ plan, cart });

	stored = JSON.stringify({ plan: { theme: 'invalid' }, cart: [...cart, 'unknown'], debug: true });
	expect(readSavedStore(storage, parsePlan, parseCart)).toEqual({ cart });
	stored = JSON.stringify({ plan, cart: 'invalid', conversation: ['private'] });
	expect(readSavedStore(storage, parsePlan, parseCart)).toEqual({ plan });
});

it('fails closed when the browser denies access to storage', () => {
	const storage = {
		getItem: () => {
			throw new DOMException('blocked', 'SecurityError');
		},
		setItem: () => {
			throw new DOMException('denied', 'QuotaExceededError');
		}
	};
	expect(readSavedStore(storage, parsePlan, parseCart)).toEqual({});
	expect(writeSavedStore(storage, {}, parsePlan, parseCart)).toBe(false);
});
