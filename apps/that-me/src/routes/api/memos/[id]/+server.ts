import { json } from '@sveltejs/kit';
import { eq, and, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';
import { memos } from '$lib/server/schema.js';
import { getDb } from '$lib/server/db.js';
import { updateMemoSchema } from '$lib/server/validation.js';
import { requireAuth, requirePlatform, parseBody } from '$lib/server/api-utils.js';

export const GET: RequestHandler = async (event) => {
	const { error: authError, user } = requireAuth(event);
	if (authError) return authError;
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const id = Number(event.params.id);
	if (isNaN(id)) return json({ error: '不正なIDです' }, { status: 400 });

	const db = getDb(platform);
	const result = await db
		.select()
		.from(memos)
		.where(and(eq(memos.id, id), eq(memos.ownerId, user.id)))
		.limit(1);

	if (result.length === 0) {
		return json({ error: 'メモが見つかりません' }, { status: 404 });
	}

	return json({ data: result[0] });
};

export const PATCH: RequestHandler = async (event) => {
	const { error: authError, user } = requireAuth(event);
	if (authError) return authError;
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const id = Number(event.params.id);
	if (isNaN(id)) return json({ error: '不正なIDです' }, { status: 400 });

	const { error: bodyError, data } = await parseBody(event.request, updateMemoSchema);
	if (bodyError) return bodyError;

	const db = getDb(platform);

	const updateValues: Record<string, unknown> = {
		updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`
	};
	if (data.title !== undefined) updateValues.title = data.title;
	if (data.content !== undefined) updateValues.content = data.content;
	if (data.folderId !== undefined) updateValues.folderId = data.folderId;

	const updated = await db
		.update(memos)
		.set(updateValues)
		.where(and(eq(memos.id, id), eq(memos.ownerId, user.id)))
		.returning();

	if (updated.length === 0) {
		return json({ error: 'メモが見つかりません' }, { status: 404 });
	}

	return json({ data: updated[0] });
};

export const DELETE: RequestHandler = async (event) => {
	const { error: authError, user } = requireAuth(event);
	if (authError) return authError;
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const id = Number(event.params.id);
	if (isNaN(id)) return json({ error: '不正なIDです' }, { status: 400 });

	const db = getDb(platform);
	const deleted = await db
		.delete(memos)
		.where(and(eq(memos.id, id), eq(memos.ownerId, user.id)))
		.returning();

	if (deleted.length === 0) {
		return json({ error: 'メモが見つかりません' }, { status: 404 });
	}

	return json({ success: true });
};
