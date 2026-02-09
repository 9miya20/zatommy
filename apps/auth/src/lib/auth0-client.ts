interface TokenResponse {
	access_token: string;
	refresh_token?: string;
	id_token?: string;
	token_type: string;
	expires_in: number;
}

interface TokenError {
	error: string;
	error_description?: string;
}

export async function exchangeCodeForTokens(params: {
	domain: string;
	clientId: string;
	clientSecret: string;
	code: string;
	codeVerifier: string;
	redirectUri: string;
}): Promise<TokenResponse> {
	const response = await fetch(`https://${params.domain}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'authorization_code',
			client_id: params.clientId,
			client_secret: params.clientSecret,
			code: params.code,
			code_verifier: params.codeVerifier,
			redirect_uri: params.redirectUri
		})
	});

	if (!response.ok) {
		const error = (await response.json()) as TokenError;
		throw new Error(`Auth0 トークン交換失敗: ${error.error_description ?? error.error}`);
	}

	return response.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(params: {
	domain: string;
	clientId: string;
	clientSecret: string;
	refreshToken: string;
}): Promise<TokenResponse> {
	const response = await fetch(`https://${params.domain}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'refresh_token',
			client_id: params.clientId,
			client_secret: params.clientSecret,
			refresh_token: params.refreshToken
		})
	});

	if (!response.ok) {
		const error = (await response.json()) as TokenError;
		throw new Error(`Auth0 トークンリフレッシュ失敗: ${error.error_description ?? error.error}`);
	}

	return response.json() as Promise<TokenResponse>;
}
