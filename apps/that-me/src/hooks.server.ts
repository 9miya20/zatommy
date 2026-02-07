import type { Handle } from '@sveltejs/kit';
import { getAuthProvider } from '$lib/server/auth-provider.js';

export const handle: Handle = async ({ event, resolve }) => {
	const platform = event.platform;
	if (!platform) {
		event.locals.user = null;
		return resolve(event);
	}

	const providerName = platform.env.AUTH_PROVIDER ?? 'dummy';
	const authProvider = getAuthProvider(providerName);
	const user = await authProvider.getCurrentUser(event.request, platform);
	event.locals.user = user;

	return resolve(event);
};
