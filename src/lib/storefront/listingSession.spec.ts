import { expect, it } from 'vitest';
import { createStoreSession } from './store.svelte';
import { defaultPlan, interpretOffline } from '../personalization';

it('records canonical viewed products once with the latest first, within each visit', () => {
	const session = createStoreSession();
	for (const id of ['cooker-one-button', 'not-in-catalog', 'aero-x', 'cooker-one-button'])
		session.listing.record(id);
	expect(session.listing.viewed).toEqual(['cooker-one-button', 'aero-x']);
	expect(createStoreSession().listing.viewed).toEqual([]);
});

it('records a listing change only when the storefront consumes its validated turn', () => {
	const session = createStoreSession();
	const text = 'minimal and compact';
	const turn = interpretOffline(text, defaultPlan, 'aero-x');
	session.listing.queue(turn, text, 'en');
	session.listing.cancel(turn);
	expect(session.listing.takeTurn()).toBeUndefined();
	expect(session.conversation.messages).toEqual([]);
	session.listing.queue(turn, text, 'en');
	expect(session.listing.takeTurn()).toEqual(turn);
	expect(session.listing.takeTurn()).toBeUndefined();
	expect(session.conversation.messages.map(({ text }) => text)).toEqual([text]);
});
