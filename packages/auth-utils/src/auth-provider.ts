import { createAuth0JwksClient } from './jwks-client.js';
import { verifyAccessToken } from './jwt-verifier.js';
import { extractCookieToken } from './middleware.js';
import type { AuthUser } from './types.js';

interface AuthConfig {
	domain: string;
	audience: string;
}

const configCache = new Map<string, AuthConfig>();

async function fetchAuthConfig(authAppUrl: string): Promise<AuthConfig> {
	const cached = configCache.get(authAppUrl);
	if (cached) return cached;

	const response = await fetch(`${authAppUrl}/auth/config`);
	if (!response.ok) {
		throw new Error(`認証設定の取得に失敗: ${response.status}`);
	}

	const config: AuthConfig = await response.json();
	configCache.set(authAppUrl, config);
	return config;
}

export interface TokenVerifier {
	verify(request: Request): Promise<AuthUser | null>;
}

export function createTokenVerifier(authAppUrl: string): TokenVerifier {
	return {
		async verify(request) {
			const token = extractCookieToken(request, 'access_token');
			if (!token) return null;

			const config = await fetchAuthConfig(authAppUrl);
			const jwks = createAuth0JwksClient(config.domain);

			return verifyAccessToken(token, {
				jwks,
				audience: config.audience,
				issuer: `https://${config.domain}/`
			});
		}
	};
}
