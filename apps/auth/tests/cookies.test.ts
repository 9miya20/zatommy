import { describe, it, expect } from 'vitest';
import { serializeCookie, createTokenCookies, createClearCookies } from '../src/lib/cookies.js';

describe('serializeCookie', () => {
	it('デフォルト値で cookie を生成する', () => {
		const result = serializeCookie({ name: 'test', value: 'abc' });
		expect(result).toContain('test=abc');
		expect(result).toContain('HttpOnly');
		expect(result).toContain('Secure');
		expect(result).toContain('SameSite=None');
		expect(result).toContain('Path=/');
	});

	it('Max-Age を設定できる', () => {
		const result = serializeCookie({ name: 'test', value: 'abc', maxAge: 3600 });
		expect(result).toContain('Max-Age=3600');
	});

	it('カスタム Path を設定できる', () => {
		const result = serializeCookie({ name: 'test', value: 'abc', path: '/token' });
		expect(result).toContain('Path=/token');
	});
});

describe('createTokenCookies', () => {
	it('access_token と refresh_token の cookie を生成する', () => {
		const cookies = createTokenCookies('at-123', 'rt-456');
		expect(cookies).toHaveLength(2);
		expect(cookies[0]).toContain('access_token=at-123');
		expect(cookies[1]).toContain('refresh_token=rt-456');
	});

	it('access_token は Path=/ である', () => {
		const cookies = createTokenCookies('at', 'rt');
		expect(cookies[0]).toContain('Path=/');
	});

	it('refresh_token は Path=/token である', () => {
		const cookies = createTokenCookies('at', 'rt');
		expect(cookies[1]).toContain('Path=/token');
	});
});

describe('createClearCookies', () => {
	it('空の cookie を Max-Age=0 で生成する', () => {
		const cookies = createClearCookies();
		expect(cookies).toHaveLength(2);
		for (const cookie of cookies) {
			expect(cookie).toContain('Max-Age=0');
		}
	});
});
