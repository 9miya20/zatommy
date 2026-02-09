import { createRemoteJWKSet } from 'jose';

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export function createAuth0JwksClient(auth0Domain: string): ReturnType<typeof createRemoteJWKSet> {
	const cached = jwksCache.get(auth0Domain);
	if (cached) return cached;

	const jwksUri = new URL(`https://${auth0Domain}/.well-known/jwks.json`);
	const jwks = createRemoteJWKSet(jwksUri);
	jwksCache.set(auth0Domain, jwks);

	return jwks;
}
