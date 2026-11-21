export async function readJson(stream: ReadableStream<Uint8Array> | null, limit: number) {
	if (!stream) throw new Error('missing body');
	const reader = stream.getReader();
	const decoder = new TextDecoder('utf-8', { fatal: true });
	let size = 0;
	let text = '';
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) return JSON.parse(text + decoder.decode()) as unknown;
			size += value.byteLength;
			if (size > limit) return undefined;
			text += decoder.decode(value, { stream: true });
		}
	} finally {
		void reader.cancel().catch(() => {});
		reader.releaseLock();
	}
}
