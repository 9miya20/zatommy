import { Hono } from 'hono';
import type { Env } from '../bindings.js';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../lib/pkce.js';
import { normalizeUri } from '../lib/url.js';

const login = new Hono<{ Bindings: Env }>();

// GET /login — ログインページ描画
login.get('/', (c) => {
	const redirectUri = c.req.query('redirect_uri') ?? '';
	const allowedUris = c.env.ALLOWED_REDIRECT_URIS.split(',').map((u) => u.trim());

	if (redirectUri && !allowedUris.map(normalizeUri).includes(normalizeUri(redirectUri))) {
		return c.text('不正な redirect_uri です', 400);
	}

	return c.html(
		<html lang="ja">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>ログイン - Zatommy</title>
				<style>{`
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
						display: flex;
						justify-content: center;
						align-items: center;
						min-height: 100vh;
						margin: 0;
						background: #f5f5f5;
					}
					.container {
						background: white;
						padding: 2rem;
						border-radius: 8px;
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
						text-align: center;
						max-width: 400px;
						width: 100%;
					}
					h1 { margin-bottom: 1.5rem; color: #333; }
					.btn {
						display: block;
						width: 100%;
						padding: 0.75rem;
						margin: 0.5rem 0;
						border: 1px solid #ddd;
						border-radius: 6px;
						background: white;
						cursor: pointer;
						font-size: 1rem;
						text-decoration: none;
						color: #333;
						transition: background 0.2s;
					}
					.btn:hover { background: #f0f0f0; }
				`}</style>
			</head>
			<body>
				<div class="container">
					<h1>ログイン</h1>
					<a
						class="btn"
						href={`/login/google${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`}
					>
						Google でログイン
					</a>
				</div>
			</body>
		</html>
	);
});

// GET /login/:provider — PKCE 生成 → Auth0 リダイレクト
login.get('/:provider', async (c) => {
	const provider = c.req.param('provider');
	const redirectUri = c.req.query('redirect_uri') ?? '';
	const allowedUris = c.env.ALLOWED_REDIRECT_URIS.split(',').map((u) => u.trim());

	if (redirectUri && !allowedUris.map(normalizeUri).includes(normalizeUri(redirectUri))) {
		return c.text('不正な redirect_uri です', 400);
	}

	// PKCE 生成
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);
	const state = generateState();

	// state → KV に code_verifier と redirect_uri を保存（5分TTL）
	await c.env.KV.put(
		`pkce:${state}`,
		JSON.stringify({ codeVerifier, redirectUri }),
		{ expirationTtl: 300 }
	);

	// Auth0 connection マッピング
	const connectionMap: Record<string, string> = {
		google: 'google-oauth2'
	};
	const connection = connectionMap[provider];
	if (!connection) {
		return c.text('サポートされていないプロバイダーです', 400);
	}

	// Auth0 の /authorize にリダイレクト
	const callbackUrl = new URL('/callback', c.req.url).toString();
	const authUrl = new URL(`https://${c.env.AUTH0_DOMAIN}/authorize`);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('client_id', c.env.AUTH0_CLIENT_ID);
	authUrl.searchParams.set('redirect_uri', callbackUrl);
	authUrl.searchParams.set('scope', 'openid profile email offline_access');
	authUrl.searchParams.set('audience', c.env.AUTH0_AUDIENCE);
	authUrl.searchParams.set('state', state);
	authUrl.searchParams.set('code_challenge', codeChallenge);
	authUrl.searchParams.set('code_challenge_method', 'S256');
	authUrl.searchParams.set('connection', connection);

	return c.redirect(authUrl.toString());
});

export default login;
