import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getAuthProvider } from '$lib/server/auth-provider.js';
import { loginSchema } from '$lib/server/validation.js';
import { requirePlatform, parseBody } from '$lib/server/api-utils.js';

export const POST: RequestHandler = async (event) => {
	const { error: platformError, platform } = requirePlatform(event);
	if (platformError) return platformError;

	const { error: bodyError, data } = await parseBody(event.request, loginSchema);
	if (bodyError) return bodyError;

	const providerName = platform.env.AUTH_PROVIDER ?? 'dummy';
	const authProvider = getAuthProvider(providerName);
	const { user, token } = await authProvider.login(data.email, platform);

	return json(
		{ user },
		{
			headers: {
				'Set-Cookie': `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
			}
		}
	);
};

export const DELETE: RequestHandler = async (event) => {
	return json(
		{ success: true },
		{
			headers: {
				'Set-Cookie': `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
			}
		}
	);
};
