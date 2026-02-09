import type { Handle } from '@sveltejs/kit';
import { getAuthProvider } from '$lib/server/auth-provider.js';
import { isTokenExpiringSoon, extractCookieToken } from '@zatommy/auth-utils';

export const handle: Handle = async ({ event, resolve }) => {
	const platform = event.platform;
	if (!platform) {
		event.locals.user = null;
		return resolve(event);
	}

	const authProvider = getAuthProvider(platform.env);

	// access_token の自動リフレッシュ
	const accessToken = extractCookieToken(event.request, 'access_token');

	if (accessToken && isTokenExpiringSoon(accessToken, 60)) {
		try {
			const authAppUrl = platform.env.AUTH_APP_URL;
			const refreshResponse = await fetch(`${authAppUrl}/token/refresh`, {
				method: 'POST',
				headers: {
					cookie: event.request.headers.get('cookie') ?? ''
				}
			});

			if (refreshResponse.ok) {
				// リフレッシュ成功 → Set-Cookie ヘッダーをレスポンスに転送
				const response = await resolve(event);
				const setCookies = refreshResponse.headers.getSetCookie();
				for (const cookie of setCookies) {
					response.headers.append('set-cookie', cookie);
				}

				// 新しい access_token で認証を再試行
				const newTokenData = (await refreshResponse.json()) as {
					access_token: string;
				};
				const newRequest = new Request(event.request.url, {
					method: event.request.method,
					headers: new Headers(event.request.headers)
				});
				newRequest.headers.set(
					'cookie',
					event.request.headers
						.get('cookie')
						?.replace(
							/access_token=[^;]+/,
							`access_token=${newTokenData.access_token}`
						) ?? `access_token=${newTokenData.access_token}`
				);

				const user = await authProvider.getCurrentUser(newRequest, platform);
				event.locals.user = user;
				return response;
			}
		} catch {
			// リフレッシュ失敗時は通常フローで処理
		}
	}

	const user = await authProvider.getCurrentUser(event.request, platform);
	event.locals.user = user;

	return resolve(event);
};
