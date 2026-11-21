import { SvelteSet } from 'svelte/reactivity';
import type { AddOn, DealReceipt, Locale } from '#lib/contracts.ts';
import type { Turn } from '../personalization';

export type ChatSendResult = boolean | void | 'superseded';

export interface ChatDeal {
	quotedAt: number;
	receipt: DealReceipt;
	addOns: readonly AddOn[];
	locale: Locale;
}

interface ReplyDetails {
	locale: Locale;
	offline: boolean;
	usedLocalSettings?: boolean;
	changes: readonly string[];
	deal?: ChatDeal;
}

export interface ChatMessage {
	id: string;
	role: 'assistant' | 'shopper';
	text: string;
	locale?: Locale;
	offline?: boolean;
	usedLocalSettings?: boolean;
	error?: boolean;
	citations?: Turn['citations'];
	productIds?: readonly string[];
	changes?: readonly string[];
	deal?: ChatDeal;
}

export class Conversation {
	messages = $state.raw<readonly ChatMessage[]>([]);
	private sequence = 0;

	clear() {
		this.messages = [];
	}

	shopper(text: string, locale: Locale) {
		this.append({ role: 'shopper', text, locale });
	}

	reply(turn: Turn, details: ReplyDetails) {
		this.append({
			role: 'assistant',
			text: turn.reply,
			...details,
			changes: [...new SvelteSet(details.changes)],
			citations: [...turn.citations],
			productIds: [...new SvelteSet(turn.productIds)]
		});
	}

	private append(message: Omit<ChatMessage, 'id'>) {
		this.messages = [...this.messages, { ...message, id: String(++this.sequence) }];
	}
}
