import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { requireAuth, requirePlatform, parseQuery } from '$lib/server/api-utils.js';
import { searchSchema, paginationSchema } from '$lib/server/validation.js';
import { z } from 'zod';

const searchQuerySchema = searchSchema.merge(paginationSchema);

export const GET: RequestHandler = async (event) => {
	const { error: authError, user } = requireAuth(event);
	if (authError) return authError;
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const { error: queryError, data } = parseQuery(event.url, searchQuerySchema);
	if (queryError) return queryError;

	const offset = (data.page - 1) * data.limit;

	// FTS5検索はD1のraw prepared statementを使用
	const countStmt = platform.env.DB.prepare(
		`SELECT COUNT(*) as total FROM memos_fts
		 JOIN memos ON memos_fts.rowid = memos.id
		 WHERE memos.owner_id = ? AND memos_fts MATCH ?`
	).bind(user.id, data.q);

	const searchStmt = platform.env.DB.prepare(
		`SELECT memos.* FROM memos_fts
		 JOIN memos ON memos_fts.rowid = memos.id
		 WHERE memos.owner_id = ? AND memos_fts MATCH ?
		 ORDER BY rank
		 LIMIT ? OFFSET ?`
	).bind(user.id, data.q, data.limit, offset);

	const [countResult, searchResult] = await platform.env.DB.batch([countStmt, searchStmt]);

	const total = (countResult.results[0] as Record<string, number>)?.total ?? 0;

	return json({
		data: searchResult.results,
		meta: {
			total,
			page: data.page,
			limit: data.limit
		}
	});
};
