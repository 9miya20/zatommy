import { jwtVerify, decodeJwt, type JWTVerifyGetKey } from 'jose';
import type { AuthUser } from './types.js';

export interface VerifyOptions {
	jwks: JWTVerifyGetKey;
	audience: string;
	issuer: string;
}

export async function verifyAccessToken(token: string, options: VerifyOptions): Promise<AuthUser> {
	const { payload } = await jwtVerify(token, options.jwks, {
		audience: options.audience,
		issuer: options.issuer,
		algorithms: ['RS256']
	});

	const sub = payload.sub;
	if (!sub) {
		throw new Error('JWT に sub クレームがありません');
	}

	return {
		sub,
		email: (payload.email as string) ?? '',
		name: (payload.name as string) ?? ''
	};
}

export function isTokenExpiringSoon(token: string, thresholdSeconds: number = 60): boolean {
	try {
		const payload = decodeJwt(token);
		if (!payload.exp) return true;
		const now = Math.floor(Date.now() / 1000);
		return payload.exp - now < thresholdSeconds;
	} catch {
		return true;
	}
}
