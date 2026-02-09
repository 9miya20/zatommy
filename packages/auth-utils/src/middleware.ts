export function extractBearerToken(request: Request): string | null {
	const authHeader = request.headers.get('authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
	return authHeader.slice(7);
}

export function extractCookieToken(request: Request, cookieName: string = 'access_token'): string | null {
	const cookie = request.headers.get('cookie');
	if (!cookie) return null;
	const match = cookie.match(new RegExp(`${cookieName}=([^;]+)`));
	return match ? match[1] : null;
}
