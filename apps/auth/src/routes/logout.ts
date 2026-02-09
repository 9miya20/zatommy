import { Hono } from 'hono';
import type { Env } from '../bindings.js';
import { createClearCookies } from '../lib/cookies.js';

const logout = new Hono<{ Bindings: Env }>();

// POST /logout — cookie 削除 → Auth0 ログアウト
logout.post('/', (c) => {
	const returnTo = c.req.query('return_to') ?? '';
	const allowedUris = c.env.ALLOWED_REDIRECT_URIS.split(',').map((u) => u.trim());

	if (returnTo && !allowedUris.includes(returnTo)) {
		return c.text('不正な return_to です', 400);
	}

	// cookie 削除
	const cookies = createClearCookies();
	const headers = new Headers();
	for (const cookie of cookies) {
		headers.append('Set-Cookie', cookie);
	}

	// Auth0 のログアウトエンドポイントにリダイレクト
	const logoutUrl = new URL(`https://${c.env.AUTH0_DOMAIN}/v2/logout`);
	logoutUrl.searchParams.set('client_id', c.env.AUTH0_CLIENT_ID);
	if (returnTo) {
		logoutUrl.searchParams.set('returnTo', returnTo);
	}

	headers.set('Location', logoutUrl.toString());
	return new Response(null, { status: 302, headers });
});

export default logout;
