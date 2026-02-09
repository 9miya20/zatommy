import { describe, it, expect, vi } from 'vitest';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { verifyAccessToken, isTokenExpiringSoon, type VerifyOptions } from '../src/jwt-verifier.js';
import { extractBearerToken, extractCookieToken } from '../src/middleware.js';

async function createTestKeyPair() {
	const { publicKey, privateKey } = await generateKeyPair('RS256');
	return { publicKey, privateKey };
}

function createMockJwks(publicKey: CryptoKey) {
	return async () => publicKey;
}

async function createTestToken(
	privateKey: CryptoKey,
	payload: Record<string, unknown>,
	options: { issuer?: string; audience?: string; expiresIn?: string } = {}
) {
	const jwt = new SignJWT(payload)
		.setProtectedHeader({ alg: 'RS256' })
		.setIssuedAt()
		.setExpirationTime(options.expiresIn ?? '1h');

	if (options.issuer) jwt.setIssuer(options.issuer);
	if (options.audience) jwt.setAudience(options.audience);

	return jwt.sign(privateKey);
}

describe('verifyAccessToken', () => {
	const issuer = 'https://test.auth0.com/';
	const audience = 'https://api.example.com';

	it('有効な JWT を検証してユーザー情報を返す', async () => {
		const { publicKey, privateKey } = await createTestKeyPair();
		const token = await createTestToken(
			privateKey,
			{ sub: 'auth0|123', email: 'test@example.com', name: 'Test User' },
			{ issuer, audience }
		);

		const result = await verifyAccessToken(token, {
			jwks: createMockJwks(publicKey),
			audience,
			issuer
		});

		expect(result).toEqual({
			sub: 'auth0|123',
			email: 'test@example.com',
			name: 'Test User'
		});
	});

	it('email/name がない場合は空文字列を返す', async () => {
		const { publicKey, privateKey } = await createTestKeyPair();
		const token = await createTestToken(
			privateKey,
			{ sub: 'auth0|456' },
			{ issuer, audience }
		);

		const result = await verifyAccessToken(token, {
			jwks: createMockJwks(publicKey),
			audience,
			issuer
		});

		expect(result.sub).toBe('auth0|456');
		expect(result.email).toBe('');
		expect(result.name).toBe('');
	});

	it('期限切れの JWT はエラーになる', async () => {
		const { publicKey, privateKey } = await createTestKeyPair();
		const token = await createTestToken(
			privateKey,
			{ sub: 'auth0|789' },
			{ issuer, audience, expiresIn: '0s' }
		);

		// 少し待って期限切れにする
		await new Promise((resolve) => setTimeout(resolve, 1100));

		await expect(
			verifyAccessToken(token, {
				jwks: createMockJwks(publicKey),
				audience,
				issuer
			})
		).rejects.toThrow();
	});

	it('audience が一致しない場合はエラーになる', async () => {
		const { publicKey, privateKey } = await createTestKeyPair();
		const token = await createTestToken(
			privateKey,
			{ sub: 'auth0|123' },
			{ issuer, audience: 'https://wrong-audience.com' }
		);

		await expect(
			verifyAccessToken(token, {
				jwks: createMockJwks(publicKey),
				audience,
				issuer
			})
		).rejects.toThrow();
	});

	it('issuer が一致しない場合はエラーになる', async () => {
		const { publicKey, privateKey } = await createTestKeyPair();
		const token = await createTestToken(
			privateKey,
			{ sub: 'auth0|123' },
			{ issuer: 'https://wrong-issuer.com/', audience }
		);

		await expect(
			verifyAccessToken(token, {
				jwks: createMockJwks(publicKey),
				audience,
				issuer
			})
		).rejects.toThrow();
	});
});

describe('isTokenExpiringSoon', () => {
	it('有効期限が十分ある場合は false を返す', async () => {
		const { privateKey } = await createTestKeyPair();
		const token = await createTestToken(privateKey, { sub: 'test' }, { expiresIn: '1h' });

		expect(isTokenExpiringSoon(token, 60)).toBe(false);
	});

	it('有効期限が閾値以内の場合は true を返す', async () => {
		const { privateKey } = await createTestKeyPair();
		const token = await createTestToken(privateKey, { sub: 'test' }, { expiresIn: '30s' });

		expect(isTokenExpiringSoon(token, 60)).toBe(true);
	});

	it('不正なトークンの場合は true を返す', () => {
		expect(isTokenExpiringSoon('invalid-token')).toBe(true);
	});
});

describe('extractBearerToken', () => {
	it('Bearer トークンを抽出する', () => {
		const request = new Request('https://example.com', {
			headers: { Authorization: 'Bearer test-token-123' }
		});
		expect(extractBearerToken(request)).toBe('test-token-123');
	});

	it('Authorization ヘッダーがない場合は null を返す', () => {
		const request = new Request('https://example.com');
		expect(extractBearerToken(request)).toBeNull();
	});

	it('Bearer 以外のスキームの場合は null を返す', () => {
		const request = new Request('https://example.com', {
			headers: { Authorization: 'Basic dGVzdDp0ZXN0' }
		});
		expect(extractBearerToken(request)).toBeNull();
	});
});

describe('extractCookieToken', () => {
	it('cookie から access_token を抽出する', () => {
		const request = new Request('https://example.com', {
			headers: { Cookie: 'access_token=my-jwt; other=value' }
		});
		expect(extractCookieToken(request)).toBe('my-jwt');
	});

	it('指定した cookie 名で抽出する', () => {
		const request = new Request('https://example.com', {
			headers: { Cookie: 'custom_token=abc123' }
		});
		expect(extractCookieToken(request, 'custom_token')).toBe('abc123');
	});

	it('cookie がない場合は null を返す', () => {
		const request = new Request('https://example.com');
		expect(extractCookieToken(request)).toBeNull();
	});
});
