import { json } from '@sveltejs/kit';
import { eq, desc, sql, and } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';
import { memos } from '$lib/server/schema.js';
import { getDb } from '$lib/server/db.js';
import { createMemoSchema, paginationSchema } from '$lib/server/validation.js';
import { requireAuth, requirePlatform, parseBody, parseQuery } from '$lib/server/api-utils.js';

export const GET: RequestHandler = async (event) => {
	const { error: authError, user } = requireAuth(event);
	if (authError) return authError;
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const { error: queryError, data: pagination } = parseQuery(event.url, paginationSchema);
	if (queryError) return queryError;

	const db = getDb(platform);
	const offset = (pagination.page - 1) * pagination.limit;

	const folderId = event.url.searchParams.get('folderId');
	const conditions = folderId
		? and(eq(memos.ownerId, user.id), eq(memos.folderId, Number(folderId)))
		: eq(memos.ownerId, user.id);

	const [countResult, items] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(memos).where(conditions),
		db
			.select()
			.from(memos)
			.where(conditions)
			.orderBy(desc(memos.updatedAt))
			.limit(pagination.limit)
			.offset(offset)
	]);

	return json({
		data: items,
		meta: {
			total: countResult[0].count,
			page: pagination.page,
			limit: pagination.limit
		}
	});
};

export const POST: RequestHandler = async (event) => {
	const { error: authError, user } = requireAuth(event);
	if (authError) return authError;
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const { error: bodyError, data } = await parseBody(event.request, createMemoSchema);
	if (bodyError) return bodyError;

	const db = getDb(platform);
	const inserted = await db
		.insert(memos)
		.values({
			title: data.title,
			content: data.content,
			ownerId: user.id,
			folderId: data.folderId ?? null
		})
		.returning();

	return json({ data: inserted[0] }, { status: 201 });
};
