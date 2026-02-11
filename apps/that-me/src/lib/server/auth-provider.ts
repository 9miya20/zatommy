import type { AuthProvider } from './auth.js';
import { createRemoteAuthProvider } from './auth-auth0.js';

export function getAuthProvider(env: App.Platform['env']): AuthProvider {
	const internalUrl = env.AUTH_APP_INTERNAL_URL ?? env.AUTH_APP_URL;
	return createRemoteAuthProvider(internalUrl);
}
