import { Hono } from 'hono';
import type { Env } from '../bindings.js';
import { exchangeCodeForTokens } from '../lib/auth0-client.js';
import { createTokenCookies } from '../lib/cookies.js';

const callback = new Hono<{ Bindings: Env }>();

// GET /callback — Auth0 からのコールバック
callback.get('/', async (c) => {
	const code = c.req.query('code');
	const state = c.req.query('state');
	const error = c.req.query('error');
	const errorDescription = c.req.query('error_description');

	if (error) {
		return c.text(`認証エラー: ${errorDescription ?? error}`, 400);
	}

	if (!code || !state) {
		return c.text('code または state が不足しています', 400);
	}

	// KV から PKCE 情報を取得
	const stored = await c.env.KV.get(`pkce:${state}`);
	if (!stored) {
		return c.text('state が無効または期限切れです', 400);
	}

	// KV から削除（再利用防止）
	await c.env.KV.delete(`pkce:${state}`);

	const { codeVerifier, redirectUri } = JSON.parse(stored) as {
		codeVerifier: string;
		redirectUri: string;
	};

	// Auth0 でコード交換
	const callbackUrl = new URL('/callback', c.req.url).toString();
	const tokens = await exchangeCodeForTokens({
		domain: c.env.AUTH0_DOMAIN,
		clientId: c.env.AUTH0_CLIENT_ID,
		clientSecret: c.env.AUTH0_CLIENT_SECRET,
		code,
		codeVerifier,
		redirectUri: callbackUrl
	});

	// cookie にトークンをセット
	const cookies = createTokenCookies(tokens.access_token, tokens.refresh_token ?? '');
	const headers = new Headers();
	for (const cookie of cookies) {
		headers.append('Set-Cookie', cookie);
	}

	// redirect_uri にリダイレクト
	const targetUri = redirectUri || '/';
	headers.set('Location', targetUri);

	return new Response(null, { status: 302, headers });
});

export default callback;
