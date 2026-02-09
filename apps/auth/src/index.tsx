import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './bindings.js';
import login from './routes/login.js';
import callback from './routes/callback.js';
import token from './routes/token.js';
import logout from './routes/logout.js';

const app = new Hono<{ Bindings: Env }>();

// CORS 設定（that-me など他アプリからのリクエストを許可）
app.use(
	'*',
	cors({
		origin: (origin, c) => {
			const allowedUris = c.env.ALLOWED_REDIRECT_URIS.split(',').map((u: string) => u.trim());
			if (allowedUris.includes(origin)) {
				return origin;
			}
			return '';
		},
		credentials: true,
		allowMethods: ['GET', 'POST', 'OPTIONS'],
		allowHeaders: ['Content-Type']
	})
);

// ルート
app.route('/login', login);
app.route('/callback', callback);
app.route('/token', token);
app.route('/logout', logout);

// ヘルスチェック
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
