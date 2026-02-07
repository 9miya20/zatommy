import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';
import { folders } from '$lib/server/schema.js';
import { getDb } from '$lib/server/db.js';
import { createFolderSchema } from '$lib/server/validation.js';
import { requireAuth, requirePlatform, parseBody } from '$lib/server/api-utils.js';

export const GET: RequestHandler = async (event) => {
	const { error: authError, user } = requireAuth(event);
	if (authError) return authError;
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const db = getDb(platform);
	const items = await db
		.select()
		.from(folders)
		.where(eq(folders.ownerId, user.id))
		.orderBy(folders.name);

	return json({ data: items });
};

export const POST: RequestHandler = async (event) => {
	const { error: authError, user } = requireAuth(event);
	if (authError) return authError;
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const { error: bodyError, data } = await parseBody(event.request, createFolderSchema);
	if (bodyError) return bodyError;

	const db = getDb(platform);
	const inserted = await db
		.insert(folders)
		.values({
			name: data.name,
			ownerId: user.id,
			parentFolderId: data.parentFolderId ?? null
		})
		.returning();

	return json({ data: inserted[0] }, { status: 201 });
};
