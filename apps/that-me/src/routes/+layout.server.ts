import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	return {
		user: locals.user,
		authAppUrl: platform?.env.AUTH_APP_URL ?? ''
	};
};
