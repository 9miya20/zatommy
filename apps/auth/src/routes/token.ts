import { Hono } from 'hono';
import type { Env } from '../bindings.js';
import { refreshAccessToken } from '../lib/auth0-client.js';
import { createTokenCookies } from '../lib/cookies.js';

const token = new Hono<{ Bindings: Env }>();

// POST /token/refresh — refresh_token で新しい access_token を取得
token.post('/refresh', async (c) => {
	const cookie = c.req.header('cookie') ?? '';
	const match = cookie.match(/refresh_token=([^;]+)/);
	const refreshToken = match ? match[1] : null;

	if (!refreshToken) {
		return c.json({ error: 'refresh_token がありません' }, 401);
	}

	try {
		const tokens = await refreshAccessToken({
			domain: c.env.AUTH0_DOMAIN,
			clientId: c.env.AUTH0_CLIENT_ID,
			clientSecret: c.env.AUTH0_CLIENT_SECRET,
			refreshToken
		});

		const cookies = createTokenCookies(tokens.access_token, tokens.refresh_token ?? refreshToken);
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		for (const cookieStr of cookies) {
			headers.append('Set-Cookie', cookieStr);
		}

		return new Response(
			JSON.stringify({ access_token: tokens.access_token }),
			{ status: 200, headers }
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'トークンリフレッシュに失敗しました';
		return c.json({ error: message }, 401);
	}
});

export default token;
