export interface CookieOptions {
	name: string;
	value: string;
	maxAge?: number;
	path?: string;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: 'Strict' | 'Lax' | 'None';
}

export function serializeCookie(options: CookieOptions): string {
	const parts = [`${options.name}=${options.value}`];

	if (options.maxAge !== undefined) {
		parts.push(`Max-Age=${options.maxAge}`);
	}
	parts.push(`Path=${options.path ?? '/'}`);
	if (options.httpOnly !== false) {
		parts.push('HttpOnly');
	}
	if (options.secure !== false) {
		parts.push('Secure');
	}
	parts.push(`SameSite=${options.sameSite ?? 'None'}`);

	return parts.join('; ');
}

export function createTokenCookies(accessToken: string, refreshToken: string): string[] {
	return [
		serializeCookie({
			name: 'access_token',
			value: accessToken,
			maxAge: 3600,
			path: '/',
			sameSite: 'None'
		}),
		serializeCookie({
			name: 'refresh_token',
			value: refreshToken,
			maxAge: 60 * 60 * 24 * 30, // 30日
			path: '/token',
			sameSite: 'None'
		})
	];
}

export function createClearCookies(): string[] {
	return [
		serializeCookie({
			name: 'access_token',
			value: '',
			maxAge: 0,
			path: '/'
		}),
		serializeCookie({
			name: 'refresh_token',
			value: '',
			maxAge: 0,
			path: '/token'
		})
	];
}
