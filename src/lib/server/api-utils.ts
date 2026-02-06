import { json, type RequestEvent } from '@sveltejs/kit';
import type { ZodType, output as ZodOutput } from 'zod';

type Success<T> = { error: null; data: T };
type Failure = { error: Response; data: null };
type Result<T> = Success<T> | Failure;

export function requireAuth(event: RequestEvent) {
	const user = event.locals.user;
	if (!user) {
		return { error: json({ error: '認証が必要です' }, { status: 401 }) as Response, user: null as null };
	}
	return { error: null as null, user };
}

export function requirePlatform(event: RequestEvent) {
	if (!event.platform) {
		return {
			error: json({ error: 'プラットフォームが利用できません' }, { status: 500 }) as Response,
			platform: null as null
		};
	}
	return { error: null as null, platform: event.platform };
}

export async function parseBody<S extends ZodType>(
	request: Request,
	schema: S
): Promise<Result<ZodOutput<S>>> {
	try {
		const body = await request.json();
		const result = schema.safeParse(body);
		if (!result.success) {
			return {
				error: json({ error: 'バリデーションエラー', details: result.error.flatten() }, { status: 400 }),
				data: null
			};
		}
		return { error: null, data: result.data };
	} catch {
		return { error: json({ error: 'JSONパースエラー' }, { status: 400 }), data: null };
	}
}

export function parseQuery<S extends ZodType>(url: URL, schema: S): Result<ZodOutput<S>> {
	const params = Object.fromEntries(url.searchParams);
	const result = schema.safeParse(params);
	if (!result.success) {
		return {
			error: json({ error: 'クエリパラメータエラー', details: result.error.flatten() }, { status: 400 }),
			data: null
		};
	}
	return { error: null, data: result.data };
}
