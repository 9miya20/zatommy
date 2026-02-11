import { eq } from 'drizzle-orm';
import { createTokenVerifier } from '@zatommy/auth-utils';
import type { AuthProvider } from './auth.js';
import { users } from './schema.js';
import { getDb } from './db.js';

export function createRemoteAuthProvider(authAppUrl: string): AuthProvider {
	const verifier = createTokenVerifier(authAppUrl);

	return {
		async getCurrentUser(request, platform) {
			try {
				const authUser = await verifier.verify(request);
				if (!authUser) return null;

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
