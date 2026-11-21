import { getProduct, type Locale } from '../catalog';
import type { Turn } from '../personalization';
import type { Conversation } from './conversation.svelte';

export class ListingSession {
	viewed: readonly string[] = [];
	#pending?: { turn: Turn; text: string; locale: Locale };

	constructor(private readonly conversation: Conversation) {}

	record(id: string) {
		if (!getProduct(id) || this.viewed[0] === id) return;
		this.viewed = [id, ...this.viewed.filter((viewed) => viewed !== id)];
	}

	queue(turn: Turn, text: string, locale: Locale) {
		this.#pending = { turn, text, locale };
	}

	cancel(turn: Turn) {
		if (this.#pending?.turn === turn) this.#pending = undefined;
	}

	takeTurn(): Turn | undefined {
		const request = this.#pending;
		this.#pending = undefined;
		if (!request) return;
		this.conversation.shopper(request.text, request.locale);
		return request.turn;
	}
}
