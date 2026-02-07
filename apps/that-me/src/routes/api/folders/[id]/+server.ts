import { json } from '@sveltejs/kit';
import { eq, and, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';
import { folders } from '$lib/server/schema.js';
import { getDb } from '$lib/server/db.js';
import { updateFolderSchema } from '$lib/server/validation.js';
import { requireAuth, requirePlatform, parseBody } from '$lib/server/api-utils.js';

export const PATCH: RequestHandler = async (event) => {
	const { error: authError, user } = requireAuth(event);
	if (authError) return authError;
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const id = Number(event.params.id);
	if (isNaN(id)) return json({ error: '不正なIDです' }, { status: 400 });

	const { error: bodyError, data } = await parseBody(event.request, updateFolderSchema);
	if (bodyError) return bodyError;

	const db = getDb(platform);

	const updateValues: Record<string, unknown> = {
		updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`
	};
	if (data.name !== undefined) updateValues.name = data.name;
	if (data.parentFolderId !== undefined) updateValues.parentFolderId = data.parentFolderId;

	const updated = await db
		.update(folders)
		.set(updateValues)
		.where(and(eq(folders.id, id), eq(folders.ownerId, user.id)))
		.returning();

	if (updated.length === 0) {
		return json({ error: 'フォルダが見つかりません' }, { status: 404 });
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
		.delete(folders)
		.where(and(eq(folders.id, id), eq(folders.ownerId, user.id)))
		.returning();

	if (deleted.length === 0) {
		return json({ error: 'フォルダが見つかりません' }, { status: 404 });
	}

	return json({ success: true });
};
