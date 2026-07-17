import { getConfig } from '$lib/server/env';
import { getIcsToken } from '$lib/server/ics';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	return {
		// Nur für angemeldete Bewohner — der Token schützt den Kalender-Feed
		icsPath: locals.authenticated
			? `/kalender.ics?token=${getIcsToken(getConfig().sessionSecret)}`
			: null
	};
};
