import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../src/lib/pkce.js';

describe('PKCE', () => {
	it('code_verifier を生成できる', () => {
		const verifier = generateCodeVerifier();
		expect(verifier).toBeTruthy();
		expect(verifier.length).toBeGreaterThan(20);
	});

	it('毎回異なる code_verifier を生成する', () => {
		const v1 = generateCodeVerifier();
		const v2 = generateCodeVerifier();
		expect(v1).not.toBe(v2);
	});

	it('code_challenge を生成できる', async () => {
		const verifier = generateCodeVerifier();
		const challenge = await generateCodeChallenge(verifier);
		expect(challenge).toBeTruthy();
		expect(challenge.length).toBeGreaterThan(20);
	});

	it('同じ verifier から同じ challenge が生成される', async () => {
		const verifier = generateCodeVerifier();
		const c1 = await generateCodeChallenge(verifier);
		const c2 = await generateCodeChallenge(verifier);
		expect(c1).toBe(c2);
	});

	it('code_challenge は base64url エンコードされている', async () => {
		const verifier = generateCodeVerifier();
		const challenge = await generateCodeChallenge(verifier);
		// base64url: + / = を含まない
		expect(challenge).not.toMatch(/[+/=]/);
	});

	it('state を生成できる', () => {
		const state = generateState();
		expect(state).toBeTruthy();
		expect(state.length).toBeGreaterThan(10);
	});
});
