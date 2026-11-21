import {
	defaultPlan,
	interpretOffline,
	type ShopperPlan
} from '../src/lib/personalization/index.ts';
import { projectLiveHints } from '../src/lib/personalization/live.ts';
import { requestLivePatch } from '../src/lib/server/live-assistant/openai.ts';
import { fillPresentationGaps } from '../src/lib/storefront/live-preview.ts';

const cases: readonly {
	name: string;
	message: string;
	matches: (patch: Partial<ShopperPlan>) => boolean;
}[] = [
	{
		name: 'Thai playful style',
		message: 'หน้าร้านดูจริงจังไป ขอจอยๆ หน่อย',
		matches: (patch) => patch.theme === 'vibrant'
	},
	{
		name: 'Thai quick scan',
		message: 'เปิดมาแล้วตาลาย อยากกวาดตาดูไวๆ',
		matches: (patch) => patch.theme === 'minimal' || patch.layout === 'list'
	},
	{
		name: 'English older-reader needs',
		message: 'My grandmother has to squint at the small print.',
		matches: (patch) => patch.theme === 'large-print'
	},
	{
		name: 'English picture-first browsing',
		message: 'Let the photos do the talking',
		matches: (patch) => patch.layout === 'grid' || patch.density === 'spacious'
	},
	{
		name: 'Mixed spec-first layout',
		message: 'ขอ specs first ดูสเปกก่อน',
		matches: (patch) => patch.layout === 'table'
	}
];

const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) {
	console.error('Set OPENAI_API_KEY in the ignored .env file before running the live sample.');
	process.exit(1);
}
let liveMatches = 0;
let offlineMatches = 0;
let liveReplies = 0;
let measuredCalls = 0;
let inputTokens = 0;
let cachedInputTokens = 0;
let outputTokens = 0;
let estimatedUsd = 0;
let pricedCalls = 0;
for (const sample of cases) {
	const local = interpretOffline(sample.message, defaultPlan).patch;
	const offline = sample.matches(local);
	const hints = projectLiveHints(sample.message);
	const result = await requestLivePatch(hints, {
		apiKey,
		model: process.env.OPENAI_MODEL,
		onUsage: (usage) => {
			measuredCalls++;
			inputTokens += usage.inputTokens;
			cachedInputTokens += usage.cachedInputTokens;
			outputTokens += usage.outputTokens;
			if (usage.estimatedUsd !== null) {
				pricedCalls++;
				estimatedUsd += usage.estimatedUsd;
			}
		}
	});
	const live = result
		? sample.matches({ ...local, ...fillPresentationGaps(local, result.patch, defaultPlan, []) })
		: false;
	offlineMatches += Number(offline);
	liveMatches += Number(live);
	liveReplies += Number(result !== null);
	console.log(
		`${sample.name}: offline ${offline ? 'match' : 'miss'}, live ${result ? (live ? 'match' : 'miss') : 'unavailable'}`
	);
}
console.log(
	`Expected presentation changes matched: offline ${offlineMatches}/${cases.length}, live ${liveMatches}/${liveReplies} replies (${liveReplies}/${cases.length} available).`
);
console.log(
	`Provider usage reported for ${measuredCalls}/${cases.length} cases. Input ${inputTokens} tokens (${cachedInputTokens} cached), output ${outputTokens} tokens.`
);
if (pricedCalls)
	console.log(`Estimated token cost for ${pricedCalls} cases: $${estimatedUsd.toFixed(6)} USD.`);
else console.log('No supported token cost estimate is available for this run.');
if (liveReplies === 0) process.exitCode = 1;
