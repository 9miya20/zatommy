import { Hono } from 'hono';
import type { Env } from '../bindings.js';
import { createClearCookies } from '../lib/cookies.js';
import { normalizeUri } from '../lib/url.js';

const logout = new Hono<{ Bindings: Env }>();

// POST /logout — cookie 削除 → Auth0 ログアウト
logout.post('/', async (c) => {
	const body = await c.req.parseBody();
	const returnTo = (typeof body['return_to'] === 'string' ? body['return_to'] : '') ?? '';
	const allowedUris = c.env.ALLOWED_REDIRECT_URIS.split(',').map((u) => u.trim());

	if (returnTo && !allowedUris.map(normalizeUri).includes(normalizeUri(returnTo))) {
		return c.text('不正な return_to です', 400);
	}

	// cookie 削除
	const cookies = createClearCookies();
	const headers = new Headers();
	for (const cookie of cookies) {
		headers.append('Set-Cookie', cookie);
	}

	// Auth0 ログアウト後に自身の /logout/callback に戻す
	const callbackUrl = new URL('/logout/callback', c.req.url);
	if (returnTo) {
		callbackUrl.searchParams.set('return_to', returnTo);
	}

	const logoutUrl = new URL(`https://${c.env.AUTH0_DOMAIN}/v2/logout`);
	logoutUrl.searchParams.set('client_id', c.env.AUTH0_CLIENT_ID);
	logoutUrl.searchParams.set('returnTo', callbackUrl.toString());

	headers.set('Location', logoutUrl.toString());
	return new Response(null, { status: 302, headers });
});

// GET /logout/callback — Auth0 ログアウト完了後、元のアプリにリダイレクト
logout.get('/callback', (c) => {
	const returnTo = c.req.query('return_to');
	return c.redirect(returnTo || '/');
});

export default logout;
