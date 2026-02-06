import type { AuthProvider } from './auth.js';
import { dummyAuth } from './auth-dummy.js';

export function getAuthProvider(providerName: string): AuthProvider {
	switch (providerName) {
		case 'dummy':
			return dummyAuth;
		default:
			return dummyAuth;
	}
}
