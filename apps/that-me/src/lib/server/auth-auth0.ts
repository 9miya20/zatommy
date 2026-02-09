import { eq } from 'drizzle-orm';
import {
	createAuth0JwksClient,
	verifyAccessToken,
	extractCookieToken
} from '@zatommy/auth-utils';
import type { AuthProvider } from './auth.js';
import { users } from './schema.js';
import { getDb } from './db.js';

export function createAuth0Provider(env: {
	AUTH0_DOMAIN: string;
	AUTH0_AUDIENCE: string;
}): AuthProvider {
	const jwks = createAuth0JwksClient(env.AUTH0_DOMAIN);
	const issuer = `https://${env.AUTH0_DOMAIN}/`;
	const audience = env.AUTH0_AUDIENCE;

	return {
		async getCurrentUser(request, platform) {
			const token = extractCookieToken(request, 'access_token');
			if (!token) return null;

			try {
				const authUser = await verifyAccessToken(token, {
					jwks,
					audience,
					issuer
				});

				// Auth0 sub → ローカルユーザーにマッピング（upsert）
				const db = getDb(platform);
				const existing = await db
					.select()
					.from(users)
					.where(eq(users.authUserId, authUser.sub))
					.limit(1);

				if (existing.length > 0) {
					return existing[0];
				}

				// 新規ユーザー作成
				const inserted = await db
					.insert(users)
					.values({
						email: authUser.email,
						name: authUser.name || authUser.email.split('@')[0],
						authUserId: authUser.sub
					})
					.returning();

				return inserted[0];
			} catch {
				return null;
			}
		}
	};
}
