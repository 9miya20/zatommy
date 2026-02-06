import { eq } from 'drizzle-orm';
import type { AuthProvider, User } from './auth.js';
import { users } from './schema.js';
import { getDb } from './db.js';

const TOKEN_PREFIX = 'dummy-';

function extractToken(request: Request): string | null {
	const cookie = request.headers.get('cookie');
	if (!cookie) return null;
	const match = cookie.match(/session=([^;]+)/);
	return match ? match[1] : null;
}

export const dummyAuth: AuthProvider = {
	async getCurrentUser(request, platform) {
		const token = extractToken(request);
		if (!token || !token.startsWith(TOKEN_PREFIX)) return null;

		const email = token.slice(TOKEN_PREFIX.length);
		const db = getDb(platform);
		const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
		return result[0] ?? null;
	},

	async login(email, platform) {
		const db = getDb(platform);
		const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

		let user: User;
		if (existing.length > 0) {
			user = existing[0];
		} else {
			const inserted = await db
				.insert(users)
				.values({ email, name: email.split('@')[0] })
				.returning();
			user = inserted[0];
		}

		return {
			user,
			token: `${TOKEN_PREFIX}${email}`
		};
	},

	async logout() {
		// ダミー認証ではサーバー側の無効化処理不要
	}
};
