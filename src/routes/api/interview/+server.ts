import { error } from '#lib/server/utils/local-json.ts';
import type { RequestHandler } from './$types';

// Older storefronts fall back to direct choices when the conversational service is unavailable.
export const POST: RequestHandler = () => error(410, 'unavailable');
