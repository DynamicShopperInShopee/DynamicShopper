import hero from './digital-hero.jpg';
import intro from './digital-intro.jpg';
import serving from './digital-serving.jpg';
import pot from './digital-pot.jpg';
import heating from './digital-heating.jpg';
import soup from './digital-soup.jpg';
import warm from './digital-warm.jpg';
import dimensions from './digital-dimensions.jpg';
import kit from './digital-kit.jpg';

/** Static, locally bundled illustrations for the simulated digital cooker. */
export const digitalMedia = {
	hero,
	intro,
	serving,
	pot,
	heating,
	soup,
	warm,
	dimensions,
	kit,
	controls: hero
} as const;
