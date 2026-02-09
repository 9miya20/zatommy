import type { AuthProvider } from './auth.js';
import { createAuth0Provider } from './auth-auth0.js';

export function getAuthProvider(env: App.Platform['env']): AuthProvider {
	return createAuth0Provider(env);
}
